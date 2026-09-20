import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { couponSchema, type Coupon } from '../schemas/coupon.schema';

export interface CouponValidationContext {
  planId: string;
  planName?: string;
  userEmail?: string;
  baseAmountRupees: number;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmountRupees: number;
  discountPercent?: number;
  finalPriceRupees: number;
  errorReason?: string;
}

export const couponRepository = {
  /**
   * Fetch all coupons for Admin management
   */
  async getAllCoupons(onlyActive: boolean = false): Promise<Coupon[]> {
    const couponsRef = collection(db, 'coupons');
    let q = query(couponsRef, orderBy('createdAt', 'desc'));
    if (onlyActive) {
      q = query(couponsRef, where('isActive', '==', true));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return couponSchema.parse({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    });
  },

  /**
   * Fetch a single coupon by ID
   */
  async getCouponById(id: string): Promise<Coupon | null> {
    const docRef = doc(db, 'coupons', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return couponSchema.parse({ id: snap.id, ...snap.data() });
  },

  /**
   * Fetch coupon by case-insensitive uppercase code
   */
  async getCouponByCode(code: string): Promise<Coupon | null> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('code', '==', cleanCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return couponSchema.parse({ id: docSnap.id, ...docSnap.data() });
  },

  /**
   * Create a new coupon
   */
  async createCoupon(data: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'timesUsed'>): Promise<string> {
    const newDocRef = doc(collection(db, 'coupons'));
    const now = new Date().toISOString();
    const cleanCode = data.code.trim().toUpperCase();

    // Check if code already exists
    const existing = await this.getCouponByCode(cleanCode);
    if (existing) {
      throw new Error(`Coupon with code "${cleanCode}" already exists.`);
    }

    const payload: Coupon = couponSchema.parse({
      ...data,
      id: newDocRef.id,
      code: cleanCode,
      timesUsed: 0,
      createdAt: now,
      updatedAt: now
    });

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  },

  /**
   * Update an existing coupon
   */
  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
    const docRef = doc(db, 'coupons', id);
    const updatePayload: Record<string, any> = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    if (updates.code) {
      updatePayload.code = updates.code.trim().toUpperCase();
    }
    await updateDoc(docRef, updatePayload);
  },

  /**
   * Delete a coupon
   */
  async deleteCoupon(id: string): Promise<void> {
    const docRef = doc(db, 'coupons', id);
    await deleteDoc(docRef);
  },

  /**
   * Increment usage count after successful order completion
   */
  async incrementCouponUsage(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'coupons', id);
      await updateDoc(docRef, {
        timesUsed: increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[couponRepository] Could not increment coupon usage:', err);
    }
  },

  /**
   * Deep Validation Engine for Checkout
   */
  async validateCouponForCheckout(code: string, context: CouponValidationContext): Promise<CouponValidationResult> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return {
        isValid: false,
        discountAmountRupees: 0,
        finalPriceRupees: context.baseAmountRupees,
        errorReason: 'Please enter a coupon code.'
      };
    }

    const coupon = await this.getCouponByCode(cleanCode);

    if (!coupon) {
      return {
        isValid: false,
        discountAmountRupees: 0,
        finalPriceRupees: context.baseAmountRupees,
        errorReason: `Coupon code "${cleanCode}" is invalid.`
      };
    }

    // 1. Active Status Check
    if (!coupon.isActive) {
      return {
        isValid: false,
        coupon,
        discountAmountRupees: 0,
        finalPriceRupees: context.baseAmountRupees,
        errorReason: 'This coupon voucher has been deactivated.'
      };
    }

    const now = new Date();

    // 2. Validity Date Range Check
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return {
        isValid: false,
        coupon,
        discountAmountRupees: 0,
        finalPriceRupees: context.baseAmountRupees,
        errorReason: 'This coupon voucher promotion has not started yet.'
      };
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return {
        isValid: false,
        coupon,
        discountAmountRupees: 0,
        finalPriceRupees: context.baseAmountRupees,
        errorReason: 'This coupon voucher has expired.'
      };
    }

    // 3. Global Usage Limit Check
    if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
      return {
        isValid: false,
        coupon,
        discountAmountRupees: 0,
        finalPriceRupees: context.baseAmountRupees,
        errorReason: 'This coupon has reached its maximum redemption limit.'
      };
    }

    // 4. Minimum Order Amount Check
    if (coupon.minOrderAmountRupees > 0 && context.baseAmountRupees < coupon.minOrderAmountRupees) {
      return {
        isValid: false,
        coupon,
        discountAmountRupees: 0,
        finalPriceRupees: context.baseAmountRupees,
        errorReason: `Minimum order amount of ₹${coupon.minOrderAmountRupees.toLocaleString('en-IN')} required for this coupon.`
      };
    }

    // 5. Plan Specific Targeting Check
    if (coupon.appliesTo === 'specific_plan' && coupon.planId) {
      if (coupon.planId !== context.planId) {
        return {
          isValid: false,
          coupon,
          discountAmountRupees: 0,
          finalPriceRupees: context.baseAmountRupees,
          errorReason: `This coupon is exclusively applicable to "${coupon.planName || 'a specific strategy'}" only.`
        };
      }
    }

    // 6. User Specific Targeting Check
    if (coupon.targetUserType === 'specific_user' && coupon.userEmail) {
      const currentEmail = (context.userEmail || '').trim().toLowerCase();
      const targetEmail = coupon.userEmail.trim().toLowerCase();
      if (!currentEmail || currentEmail !== targetEmail) {
        return {
          isValid: false,
          coupon,
          discountAmountRupees: 0,
          finalPriceRupees: context.baseAmountRupees,
          errorReason: `This exclusive voucher is only assigned to authorized account ${coupon.userEmail}.`
        };
      }
    }

    // 7. Calculate Discount Amount
    let discountRupees = 0;
    let discountPercent = 0;

    if (coupon.discountType === 'percentage') {
      discountPercent = Math.min(100, Math.max(0, coupon.discountValue));
      discountRupees = Math.round((context.baseAmountRupees * discountPercent) / 100);
    } else {
      // Fixed Amount
      discountRupees = Math.min(context.baseAmountRupees, Math.max(0, coupon.discountValue));
      discountPercent = Math.round((discountRupees / context.baseAmountRupees) * 100);
    }

    const finalPrice = Math.max(0, context.baseAmountRupees - discountRupees);

    return {
      isValid: true,
      coupon,
      discountAmountRupees: discountRupees,
      discountPercent,
      finalPriceRupees: finalPrice
    };
  }
};
