export type LegalDocType = 'terms' | 'guidelines' | 'privacy';

export interface LegalDocumentItem {
  id: LegalDocType;
  label: string;
  title: string;
  badge: string;
}
