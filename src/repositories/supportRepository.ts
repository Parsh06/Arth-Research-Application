import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SupportTicketSchema, SupportMessageSchema } from '../schemas/support.schema';
import type { SupportTicket, SupportMessage } from '../schemas/support.schema';

export const supportRepository = {
  /**
   * Create a new support ticket and its initial message atomically
   */
  async createTicket(data: {
    userId: string;
    userEmail: string;
    userName: string;
    subject: string;
    category?: 'portfolio' | 'billing' | 'technical' | 'advisory' | 'general';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    message: string;
  }): Promise<string> {
    const ticketRef = doc(collection(db, 'tickets'));
    const messageRef = doc(collection(db, 'tickets', ticketRef.id, 'messages'));
    const now = new Date().toISOString();

    const ticketData: SupportTicket = SupportTicketSchema.parse({
      id: ticketRef.id,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      subject: data.subject,
      category: data.category || 'general',
      priority: data.priority || 'medium',
      status: 'open',
      lastMessageSnippet: data.message.slice(0, 100),
      createdAt: now,
      updatedAt: now
    });

    const messageData: SupportMessage = SupportMessageSchema.parse({
      id: messageRef.id,
      ticketId: ticketRef.id,
      senderId: data.userId,
      senderRole: 'user',
      senderName: data.userName,
      message: data.message,
      createdAt: now
    });

    await runTransaction(db, async (txn) => {
      txn.set(ticketRef, ticketData);
      txn.set(messageRef, messageData);
    });

    return ticketRef.id;
  },

  /**
   * Get all tickets for a specific user
   */
  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => SupportTicketSchema.parse(d.data()));
  },

  /**
   * Get all tickets (Admin)
   */
  async getAllTickets(): Promise<SupportTicket[]> {
    const q = query(
      collection(db, 'tickets'),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => SupportTicketSchema.parse(d.data()));
  },

  /**
   * Subscribe to user tickets in real-time
   */
  subscribeToUserTickets(userId: string, callback: (tickets: SupportTicket[]) => void) {
    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const tickets = snap.docs.map(d => SupportTicketSchema.parse(d.data()));
      callback(tickets);
    });
  },

  /**
   * Subscribe to all tickets in real-time (Admin)
   */
  subscribeToAllTickets(callback: (tickets: SupportTicket[]) => void) {
    const q = query(
      collection(db, 'tickets'),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const tickets = snap.docs.map(d => SupportTicketSchema.parse(d.data()));
      callback(tickets);
    });
  },

  /**
   * Subscribe to messages for a specific ticket
   */
  subscribeToTicketMessages(ticketId: string, callback: (messages: SupportMessage[]) => void) {
    const q = query(
      collection(db, 'tickets', ticketId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      const messages = snap.docs.map(d => SupportMessageSchema.parse(d.data()));
      callback(messages);
    });
  },

  /**
   * Send a reply message in a ticket thread
   */
  async sendMessage(params: {
    ticketId: string;
    senderId: string;
    senderRole: 'user' | 'admin' | 'support';
    senderName: string;
    message: string;
  }): Promise<void> {
    const ticketRef = doc(db, 'tickets', params.ticketId);
    const messageRef = doc(collection(db, 'tickets', params.ticketId, 'messages'));
    const now = new Date().toISOString();

    const messageData: SupportMessage = SupportMessageSchema.parse({
      id: messageRef.id,
      ticketId: params.ticketId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      senderName: params.senderName,
      message: params.message,
      createdAt: now
    });

    await runTransaction(db, async (txn) => {
      const ticketSnap = await txn.get(ticketRef);
      if (!ticketSnap.exists()) {
        throw new Error(`Ticket ${params.ticketId} not found`);
      }
      
      const newStatus = params.senderRole === 'user' ? 'open' : 'in_progress';
      txn.set(messageRef, messageData);
      txn.update(ticketRef, {
        updatedAt: now,
        lastMessageSnippet: params.message.slice(0, 100),
        status: newStatus
      });
    });
  },

  /**
   * Update ticket status (e.g. resolve or close)
   */
  async updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  }
};
