import { useEffect, useRef } from 'react';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';

const formatINR = (amt: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Auto-compute derived fields for all notice types and push
 * natural language notifications to chat.
 */
export function useAutoCompute(addBotMessage: (text: string, type: 'computed') => void) {
  const noticeFields = useNoticeFieldsStore((s) => s.noticeFields);
  const noticeType = useNoticeFieldsStore((s) => s.noticeType);
  const setField = useNoticeFieldsStore((s) => s.setField);

  // ── Demand 13(2): total amount + repayment deadline ──
  const prevDemandRef = useRef<{ p: number; i: number; o: number }>({ p: 0, i: 0, o: 0 });

  useEffect(() => {
    if (noticeType !== 'demand_13_2') return;
    const p = Number(noticeFields.outstandingPrincipal ?? 0);
    const i = Number(noticeFields.outstandingInterest ?? 0);
    const o = Number(noticeFields.otherCharges ?? 0);
    const total = p + i + o;

    if (p === prevDemandRef.current.p && i === prevDemandRef.current.i && o === prevDemandRef.current.o) return;
    prevDemandRef.current = { p, i, o };

    if (total > 0) {
      setField('totalAmountDemanded', total);
      addBotMessage(`Total amount demanded auto-computed: ${formatINR(total)} (Principal + Interest + Other Charges)`, 'computed');
    }
  }, [noticeType, noticeFields.outstandingPrincipal, noticeFields.outstandingInterest, noticeFields.otherCharges, setField, addBotMessage]);

  useEffect(() => {
    if (noticeType !== 'demand_13_2') return;
    const noticeDate = noticeFields.noticeDate as string | undefined;
    if (!noticeDate) return;
    const nd = new Date(noticeDate);
    if (isNaN(nd.getTime())) return;
    const deadline = new Date(nd);
    deadline.setDate(deadline.getDate() + 60);
    setField('repaymentDeadline', deadline.toISOString().split('T')[0]);
  }, [noticeType, noticeFields.noticeDate, setField]);

  // ── Possession 13(4): Section 17 DRT deadline ──
  const prevPossDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (noticeType !== 'possession_13_4') return;
    const possDate = noticeFields.dateOfPossession as string | undefined;
    if (!possDate || possDate === prevPossDateRef.current) return;
    prevPossDateRef.current = possDate;

    const pd = new Date(possDate);
    if (isNaN(pd.getTime())) return;
    const s17 = new Date(pd);
    s17.setDate(s17.getDate() + 45);
    const s17Str = s17.toISOString().split('T')[0];
    setField('section17Deadline', s17Str);
    addBotMessage(
      `Section 17 DRT appeal deadline auto-computed: ${formatDate(s17Str)} (possession date + 45 days). The borrower may approach the DRT before this date.`,
      'computed',
    );
  }, [noticeType, noticeFields.dateOfPossession, setField, addBotMessage]);

  // ── Sale/Auction: minimum auction date + EMD percentage ──
  const prevSaleNoticeDateRef = useRef<string | null>(null);
  const prevEmdRef = useRef<{ emd: number; reserve: number }>({ emd: 0, reserve: 0 });

  useEffect(() => {
    if (noticeType !== 'sale_auction') return;
    const nd = noticeFields.noticeDate as string | undefined;
    if (!nd || nd === prevSaleNoticeDateRef.current) return;
    prevSaleNoticeDateRef.current = nd;

    const d = new Date(nd);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + 30);
    const minDate = d.toISOString().split('T')[0];
    setField('minimumAuctionDate', minDate);
    addBotMessage(
      `Minimum auction date auto-computed: ${formatDate(minDate)} (sale notice date + 30 days per Rule 8(6)).`,
      'computed',
    );
  }, [noticeType, noticeFields.noticeDate, setField, addBotMessage]);

  useEffect(() => {
    if (noticeType !== 'sale_auction') return;
    const emd = Number(noticeFields.emdAmount ?? 0);
    const reserve = Number(noticeFields.reservePrice ?? 0);
    if (emd === prevEmdRef.current.emd && reserve === prevEmdRef.current.reserve) return;
    prevEmdRef.current = { emd, reserve };

    if (emd > 0 && reserve > 0) {
      const pct = Math.round((emd / reserve) * 10000) / 100;
      addBotMessage(
        `EMD of ${formatINR(emd)} is ${pct}% of the reserve price (${formatINR(reserve)}).`,
        'computed',
      );
    }
  }, [noticeType, noticeFields.emdAmount, noticeFields.reservePrice, addBotMessage]);
}
