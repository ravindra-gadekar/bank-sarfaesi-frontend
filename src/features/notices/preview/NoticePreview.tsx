import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';
import { useAuthStore } from '@/store/authStore';

export default function NoticePreview() {
  const { noticeType, noticeFields, caseData } = useNoticeFieldsStore();
  const { user, branches } = useAuthStore();

  const getVal = (key: string) => (noticeFields[key] ?? '') as string;
  const getNum = (key: string) => Number(noticeFields[key] ?? 0);
  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '___________';

  const borrowers = (caseData?.borrowers as Array<{ name: string; address: string; type: string }>) || [];
  const primary = borrowers.find((b) => b.type === 'primary');
  const coBorrowers = borrowers.filter((b) => b.type === 'co-borrower');
  const guarantors = borrowers.filter((b) => b.type === 'guarantor');
  const allRecipients = [...(primary ? [primary] : []), ...coBorrowers, ...guarantors];

  const assets = (caseData?.securedAssets as Array<{ assetType: string; description: string; surveyNo?: string; district?: string; state?: string }>) || [];
  const secDocs = (caseData?.securityDocuments as Array<{ documentType: string; documentNo?: string; date: string }>) || [];

  const currentBranch = branches.find((b) => b.branchId === user?.branchId);
  const bankName = currentBranch?.bankName || '[Bank Name]';
  const branchName = currentBranch?.branchName || '[Branch Name]';
  const loanAccountNo = (caseData as Record<string, unknown>)?.accountNo as string || '[Loan Account No]';

  /* ─── Shared layout parts ─── */
  const letterhead = (
    <div className="text-center border-b-2 border-ink dark:border-dark-text pb-4 mb-6">
      <h2 className="text-lg font-bold uppercase">{bankName}</h2>
      <p className="text-xs text-ink-secondary dark:text-dark-text-secondary">{branchName}</p>
    </div>
  );

  const datePlaceRow = (
    <div className="flex justify-between mb-4">
      <div><strong>Date:</strong> {formatDate(getVal('noticeDate'))}</div>
      <div><strong>Place:</strong> {getVal('placeOfNotice') || '___________'}</div>
    </div>
  );

  const recipientBlock = (
    <div className="mb-4">
      <strong>To:</strong>
      <ol className="list-decimal ml-6 mt-1 space-y-1">
        {allRecipients.map((r, i) => (
          <li key={i}>
            <strong>{r.name}</strong> ({r.type})<br />
            {r.address}
          </li>
        ))}
      </ol>
    </div>
  );

  const signatureBlock = (
    <div className="mt-10 text-right">
      <p className="font-bold">{getVal('authorizedOfficerName') || '[Name]'}</p>
      <p>{getVal('authorizedOfficerDesignation') || '[Designation]'}</p>
      <p>Authorized Officer</p>
      <p>{bankName}, {branchName}</p>
    </div>
  );

  const assetsBlock = assets.length > 0 && (
    <>
      <p className="mt-3"><strong>Description of the Secured Assets:</strong></p>
      <ol className="list-decimal ml-6 space-y-1">
        {assets.map((a, i) => (
          <li key={i}>
            <strong>{a.assetType}</strong> — {a.description}
            {a.surveyNo && <>, Survey No: {a.surveyNo}</>}
            {a.district && <>, District: {a.district}, {a.state}</>}
          </li>
        ))}
      </ol>
    </>
  );

  /* ─── Demand Notice Body ─── */
  const renderDemandBody = () => {
    const totalAmount = getNum('outstandingPrincipal') + getNum('outstandingInterest') + getNum('otherCharges');
    return (
      <>
        <div className="text-center mb-6">
          <h3 className="text-base font-bold uppercase underline">
            DEMAND NOTICE UNDER SECTION 13(2) OF THE SECURITISATION AND RECONSTRUCTION OF FINANCIAL ASSETS AND ENFORCEMENT OF SECURITY INTEREST ACT, 2002
          </h3>
        </div>
        {datePlaceRow}
        {recipientBlock}
        <div className="space-y-3">
          <p><strong>Loan Account No:</strong> {loanAccountNo}</p>
          <p>Dear Sir/Madam,</p>
          <p>
            Under the provisions of Section 13(2) of the Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002 read with Rule 3 of the Security Interest (Enforcement) Rules, 2002, we hereby issue this demand notice to you.
          </p>
          <p>
            {primary?.name || '[Borrower Name]'} (hereinafter referred to as &ldquo;the Borrower&rdquo;) had availed credit facility/loan from {bankName}, {branchName}, bearing Account No. {loanAccountNo}.
          </p>
          <p>The said account has been classified as <strong>Non-Performing Asset (NPA)</strong> as per the guidelines of Reserve Bank of India.</p>
          <p>The details of the outstanding amounts are as follows:</p>
          <table className="w-full border-collapse border border-ink/20 dark:border-dark-border my-3">
            <tbody>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Outstanding Principal</td>
                <td className="p-2 text-right">{formatCurrency(getNum('outstandingPrincipal'))}</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Outstanding Interest</td>
                <td className="p-2 text-right">{formatCurrency(getNum('outstandingInterest'))}</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Other Charges</td>
                <td className="p-2 text-right">{formatCurrency(getNum('otherCharges'))}</td>
              </tr>
              <tr className="font-bold">
                <td className="p-2">Total Amount Demanded</td>
                <td className="p-2 text-right">{formatCurrency(totalAmount)}</td>
              </tr>
            </tbody>
          </table>
          <p>
            You are hereby called upon to repay the aforesaid amount of <strong>{formatCurrency(totalAmount)}</strong> within <strong>60 days</strong> from the date of receipt of this notice, i.e., on or before <strong>{formatDate(getVal('repaymentDeadline'))}</strong>, failing which the undersigned shall be constrained to exercise all or any of the rights under Section 13(4) of the said Act, including:
          </p>
          <ol className="list-decimal ml-6 space-y-1">
            <li>Taking possession of the secured assets;</li>
            <li>Taking over the management of the secured assets;</li>
            <li>Appointing any person to manage the secured assets; and</li>
            <li>Requiring any person who has acquired any of the secured assets from the borrower to pay the outstanding amount.</li>
          </ol>
          {assetsBlock}
          {secDocs.length > 0 && (
            <>
              <p className="mt-3"><strong>Security Documents:</strong></p>
              <ol className="list-decimal ml-6 space-y-1">
                {secDocs.map((d, i) => (
                  <li key={i}>{d.documentType}{d.documentNo && ` (No: ${d.documentNo})`} dated {formatDate(d.date)}</li>
                ))}
              </ol>
            </>
          )}
          <p className="mt-3">Please note that further interest and incidental charges/costs shall continue to accrue on the aforesaid amount until the date of actual payment.</p>
          <p>This notice is without prejudice to the rights of {bankName} under any other law for the time being in force.</p>
        </div>
      </>
    );
  };

  /* ─── Possession Notice Body ─── */
  const renderPossessionBody = () => {
    const outstanding = getNum('outstandingOnPossessionDate');
    const mode = getVal('modeOfPossession') || 'symbolic';
    return (
      <>
        <div className="text-center mb-6">
          <h3 className="text-base font-bold uppercase underline">
            POSSESSION NOTICE UNDER SECTION 13(4) OF THE SECURITISATION AND RECONSTRUCTION OF FINANCIAL ASSETS AND ENFORCEMENT OF SECURITY INTEREST ACT, 2002
          </h3>
          <p className="text-xs mt-1">(Read with Rule 8(1) of the Security Interest (Enforcement) Rules, 2002)</p>
        </div>
        {datePlaceRow}
        {recipientBlock}
        <div className="space-y-3">
          <p><strong>Loan Account No:</strong> {loanAccountNo}</p>
          <p>Dear Sir/Madam,</p>
          <p>
            Whereas, {bankName}, {branchName} (hereinafter referred to as &ldquo;the Secured Creditor&rdquo;) had issued a Demand Notice dated <strong>{formatDate(getVal('refDemandNoticeDate'))}</strong> under Section 13(2) of the SARFAESI Act, 2002, demanding repayment of <strong>{formatCurrency(getNum('refDemandAmountDemanded'))}</strong> within 60 days.
          </p>
          <p>
            Whereas, the Borrower {primary?.name || '[Borrower Name]'} having failed to repay the aforesaid amount within the stipulated period of 60 days, the Secured Creditor hereby exercises the rights conferred under Section 13(4) of the Act.
          </p>
          <p>
            The total outstanding amount as on the date of possession is <strong>{formatCurrency(outstanding)}</strong>.
          </p>
          <p>
            Notice is hereby given that the undersigned, being the Authorized Officer of {bankName}, has taken <strong>{mode === 'physical' ? 'physical' : 'symbolic'} possession</strong> of the following secured assets on <strong>{formatDate(getVal('dateOfPossession'))}</strong>:
          </p>
          {assetsBlock}

          <p className="mt-3"><strong>Witnesses to Possession:</strong></p>
          <ol className="list-decimal ml-6 space-y-1">
            <li>{getVal('witness1Name')}, {getVal('witness1Designation')}</li>
            {getVal('witness2Name') && (
              <li>{getVal('witness2Name')}, {getVal('witness2Designation')}</li>
            )}
          </ol>

          <p className="mt-3">
            This notice has been / shall be published in the following newspapers:
          </p>
          <ol className="list-decimal ml-6 space-y-1">
            <li><strong>{getVal('newspaper1Name')}</strong> (English) — Date: {formatDate(getVal('newspaper1Date'))}</li>
            <li><strong>{getVal('newspaper2Name')}</strong> (Vernacular) — Date: {formatDate(getVal('newspaper2Date'))}</li>
          </ol>

          <p className="mt-3">
            The Borrower&apos;s attention is invited to the provisions of Section 13(8) of the Act, which permits the Borrower to tender the dues of the Secured Creditor at any time before the date fixed for sale/transfer, thereby entitling the Borrower to get back the secured assets.
          </p>

          <p>
            The Borrower may file an application under Section 17 of the Act before the <strong>Debt Recovery Tribunal — {getVal('drtNameLocation') || '[DRT Name & Location]'}</strong> on or before <strong>{formatDate(getVal('section17Deadline'))}</strong> (within 45 days from the date of possession).
          </p>

          <p>This notice is without prejudice to any other rights or remedies available to {bankName} under any law for the time being in force.</p>
        </div>
      </>
    );
  };

  /* ─── Sale / Auction Notice Body ─── */
  const renderSaleAuctionBody = () => {
    const outstanding = getNum('outstandingOnSaleNoticeDate');
    const inspectionDates = (noticeFields.propertyInspectionDates as string[]) || [];
    const emdModes = (noticeFields.emdPaymentModes as string[]) || [];
    return (
      <>
        <div className="text-center mb-6">
          <h3 className="text-base font-bold uppercase underline">
            SALE NOTICE FOR SALE OF IMMOVABLE / MOVABLE PROPERTY
          </h3>
          <p className="text-xs mt-1">(Under Rule 8(5), 8(6) & Rule 9 of the Security Interest (Enforcement) Rules, 2002)</p>
        </div>
        {datePlaceRow}
        {recipientBlock}
        <div className="space-y-3">
          <p><strong>Loan Account No:</strong> {loanAccountNo}</p>
          <p>Dear Sir/Madam,</p>
          <p>
            Whereas, the Authorized Officer of {bankName}, {branchName} had taken possession of the secured assets on <strong>{formatDate(getVal('refPossessionDate'))}</strong> under Section 13(4) of the SARFAESI Act, 2002.
          </p>
          <p>
            Notice is hereby given to the public in general and to the Borrower {primary?.name || '[Borrower Name]'} / Co-Borrower(s) / Guarantor(s) in particular that the undersigned, being the Authorized Officer, proposes to sell the following secured assets to recover the outstanding dues of <strong>{formatCurrency(outstanding)}</strong>.
          </p>

          {assetsBlock}

          <table className="w-full border-collapse border border-ink/20 dark:border-dark-border my-3">
            <tbody>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Reserve Price</td>
                <td className="p-2 text-right">{formatCurrency(getNum('reservePrice'))}</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Earnest Money Deposit (EMD)</td>
                <td className="p-2 text-right">{formatCurrency(getNum('emdAmount'))}</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">EMD Submission Deadline</td>
                <td className="p-2 text-right">{formatDate(getVal('emdDeadline'))}</td>
              </tr>
              {emdModes.length > 0 && (
                <tr className="border-b border-ink/10">
                  <td className="p-2 font-medium">EMD Payment Modes</td>
                  <td className="p-2 text-right">{emdModes.join(', ')}</td>
                </tr>
              )}
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Bid Increment Amount</td>
                <td className="p-2 text-right">{formatCurrency(getNum('bidIncrementAmount'))}</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-3"><strong>Auction Details:</strong></p>
          <table className="w-full border-collapse border border-ink/20 dark:border-dark-border my-3">
            <tbody>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Date of Auction</td>
                <td className="p-2 text-right">{formatDate(getVal('auctionDate'))}</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Time of Auction</td>
                <td className="p-2 text-right">{getVal('auctionTime') || '___________'}</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Mode</td>
                <td className="p-2 text-right capitalize">{getVal('auctionVenueMode') || '___________'}</td>
              </tr>
              <tr className="border-b border-ink/10">
                <td className="p-2 font-medium">Venue / URL</td>
                <td className="p-2 text-right">{getVal('auctionVenueAddress') || '___________'}</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-3"><strong>Valuation Reports:</strong></p>
          <ol className="list-decimal ml-6 space-y-1">
            <li>{getVal('valuer1Name')} — Report dated {formatDate(getVal('valuer1ReportDate'))}</li>
            <li>{getVal('valuer2Name')} — Report dated {formatDate(getVal('valuer2ReportDate'))}</li>
          </ol>

          {inspectionDates.length > 0 && (
            <>
              <p className="mt-3"><strong>Property Inspection Dates:</strong></p>
              <ol className="list-decimal ml-6 space-y-1">
                {inspectionDates.map((d, i) => (
                  <li key={i}>{formatDate(d)}</li>
                ))}
              </ol>
              <p>
                Contact: <strong>{getVal('inspectionContactName')}</strong> — {getVal('inspectionContactPhone')}
              </p>
            </>
          )}

          {getVal('encumbranceStatus') && (
            <p className="mt-3"><strong>Encumbrance Status:</strong> {getVal('encumbranceStatus')}</p>
          )}

          {getVal('termsAndConditions') && (
            <>
              <p className="mt-3"><strong>Terms and Conditions:</strong></p>
              <p className="whitespace-pre-line">{getVal('termsAndConditions')}</p>
            </>
          )}

          <p className="mt-3">
            The Borrower&apos;s attention is invited to the provisions of Section 13(8) of the SARFAESI Act, 2002, which permits the Borrower to tender the dues of the Secured Creditor at any time before the date fixed for sale, thereby entitling the Borrower to get back the secured assets.
          </p>

          <p>This notice is without prejudice to any other rights or remedies available to {bankName} under any law for the time being in force.</p>
        </div>
      </>
    );
  };

  /* ─── Body dispatch by notice type ─── */
  const renderBody = () => {
    switch (noticeType) {
      case 'possession_13_4':
        return renderPossessionBody();
      case 'sale_auction':
        return renderSaleAuctionBody();
      default:
        return renderDemandBody();
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-dark-surface p-10 border border-sand-300 dark:border-dark-border rounded-xl shadow-sm text-sm leading-relaxed text-ink dark:text-dark-text">
      {letterhead}
      {renderBody()}
      {signatureBlock}
    </div>
  );
}
