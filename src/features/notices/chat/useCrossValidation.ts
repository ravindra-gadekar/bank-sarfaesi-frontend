import { useEffect, useRef } from 'react';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';

/**
 * Monitors notice fields and pushes cross-validation warnings/errors
 * to the chat as bot messages. Covers all 3 notice types.
 */
export function useCrossValidation(addBotMessage: (text: string, type: 'validation' | 'computed') => void) {
  const noticeFields = useNoticeFieldsStore((s) => s.noticeFields);
  const noticeType = useNoticeFieldsStore((s) => s.noticeType);
  const caseData = useNoticeFieldsStore((s) => s.caseData);
  // Track which warnings we've already fired to avoid duplicates per value
  const firedRef = useRef<Set<string>>(new Set());

  const warn = (key: string, msg: string) => {
    if (firedRef.current.has(key)) return;
    firedRef.current.add(key);
    addBotMessage(msg, 'validation');
  };

  // Reset fired warnings when notice type changes
  useEffect(() => {
    firedRef.current.clear();
  }, [noticeType]);

  // ── Common: SARFAESI threshold + NPA 90 days ──
  useEffect(() => {
    if (!caseData) return;
    const cd = caseData as Record<string, unknown>;

    const sanctionAmount = cd.sanctionAmount as number | undefined;
    if (sanctionAmount && sanctionAmount < 100000) {
      warn('threshold', 'Error: Sanction amount is below ₹1,00,000 — SARFAESI Act does not apply.');
    }

    const noticeDate = noticeFields.noticeDate as string | undefined;
    const npaDate = cd.npaDate as string | undefined;
    if (noticeDate && npaDate) {
      const nd = new Date(noticeDate);
      const npd = new Date(npaDate);
      const diffDays = Math.floor((nd.getTime() - npd.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 90) {
        warn(
          `npa90_${noticeDate}`,
          `Warning: NPA date is only ${diffDays} days before the notice date. SARFAESI requires at least 90 days.`,
        );
      }
    }
  }, [noticeFields.noticeDate, caseData, noticeType, addBotMessage]);

  // ── Possession 13(4): date ≥ 13(2) + 60 days, newspaper within 7 days ──
  useEffect(() => {
    if (noticeType !== 'possession_13_4') return;

    const possDate = noticeFields.dateOfPossession as string | undefined;
    const refDate = noticeFields.refDemandNoticeDate as string | undefined;

    if (possDate && refDate) {
      const pd = new Date(possDate);
      const rd = new Date(refDate);
      const gap = Math.floor((pd.getTime() - rd.getTime()) / (1000 * 60 * 60 * 24));
      if (gap < 60) {
        warn(
          `60day_${possDate}`,
          `Error: Possession date is only ${gap} days after the 13(2) demand notice. Minimum 60-day gap is required under SARFAESI.`,
        );
      }
    }

    // Newspaper dates within 7 days of possession
    if (possDate) {
      const pd = new Date(possDate);
      const checkNewspaper = (paperDate: string | undefined, label: string) => {
        if (!paperDate) return;
        const npd = new Date(paperDate);
        const diff = Math.abs(Math.floor((npd.getTime() - pd.getTime()) / (1000 * 60 * 60 * 24)));
        if (diff > 7) {
          warn(
            `news_${label}_${paperDate}`,
            `Warning: ${label} publication date is ${diff} days from possession date. It should be within 7 days.`,
          );
        }
      };
      checkNewspaper(noticeFields.newspaper1Date as string, 'English newspaper');
      checkNewspaper(noticeFields.newspaper2Date as string, 'Vernacular newspaper');
    }

    // Same witness name warning
    const w1 = (noticeFields.witness1Name as string || '').toLowerCase().trim();
    const w2 = (noticeFields.witness2Name as string || '').toLowerCase().trim();
    if (w1 && w2 && w1 === w2) {
      warn('same_witness', 'Warning: Both witnesses have the same name. Two independent witnesses are recommended.');
    }
  }, [
    noticeType,
    noticeFields.dateOfPossession,
    noticeFields.refDemandNoticeDate,
    noticeFields.newspaper1Date,
    noticeFields.newspaper2Date,
    noticeFields.witness1Name,
    noticeFields.witness2Name,
    addBotMessage,
  ]);

  // ── Sale/Auction: auction ≥ notice + 30 days, EMD < auction, valuers, full chain ──
  useEffect(() => {
    if (noticeType !== 'sale_auction') return;

    const noticeDate = noticeFields.noticeDate as string | undefined;
    const auctionDate = noticeFields.auctionDate as string | undefined;
    const emdDeadline = noticeFields.emdDeadline as string | undefined;
    const reservePrice = Number(noticeFields.reservePrice ?? 0);
    const emdAmount = Number(noticeFields.emdAmount ?? 0);

    // Auction ≥ notice + 30 days
    if (noticeDate && auctionDate) {
      const nd = new Date(noticeDate);
      const ad = new Date(auctionDate);
      const gap = Math.floor((ad.getTime() - nd.getTime()) / (1000 * 60 * 60 * 24));
      if (gap < 30) {
        warn(
          `30day_${auctionDate}`,
          `Error: Auction date is only ${gap} days after the sale notice. Rule 8(6) requires a minimum 30-day gap.`,
        );
      }
    }

    // EMD deadline before auction date
    if (emdDeadline && auctionDate) {
      if (new Date(emdDeadline) >= new Date(auctionDate)) {
        warn(
          `emd_deadline_${emdDeadline}`,
          'Error: EMD deadline must be before the auction date.',
        );
      }
    }

    // EMD > reserve price warning
    if (emdAmount > 0 && reservePrice > 0 && emdAmount > reservePrice) {
      warn(
        `emd_exceed_${emdAmount}`,
        'Warning: EMD amount exceeds the reserve price. Typically EMD is 10% of reserve.',
      );
    }

    // Same valuer name
    const v1 = (noticeFields.valuer1Name as string || '').toLowerCase().trim();
    const v2 = (noticeFields.valuer2Name as string || '').toLowerCase().trim();
    if (v1 && v2 && v1 === v2) {
      warn('same_valuer', 'Warning: Both valuers have the same name. Two independent valuers are required under SARFAESI.');
    }

    // Possession → Sale chain (possession + 30 days)
    const refPossDate = noticeFields.refPossessionDate as string | undefined;
    if (refPossDate && noticeDate) {
      const rpd = new Date(refPossDate);
      const nd = new Date(noticeDate);
      const gap = Math.floor((nd.getTime() - rpd.getTime()) / (1000 * 60 * 60 * 24));
      if (gap < 0) {
        warn(
          `possession_chain_${noticeDate}`,
          'Error: Sale notice date is before the possession date. This is not permitted.',
        );
      }
    }
  }, [
    noticeType,
    noticeFields.noticeDate,
    noticeFields.auctionDate,
    noticeFields.emdDeadline,
    noticeFields.reservePrice,
    noticeFields.emdAmount,
    noticeFields.valuer1Name,
    noticeFields.valuer2Name,
    noticeFields.refPossessionDate,
    addBotMessage,
  ]);
}
