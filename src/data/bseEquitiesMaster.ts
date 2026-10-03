// src/data/bseEquitiesMaster.ts
/**
 * Curated high-reliability BSE Equity Securities Master Registry (Client-side)
 * Enables instant zero-latency suggestions and bulletproof fallback in production
 */

export interface BseMasterEquity {
  scripCode: string;
  symbol: string;
  companyName: string;
  isin: string;
  type: string;
}

export const BSE_TOP_EQUITIES: BseMasterEquity[] = [
  { scripCode: '500013', symbol: 'ANSALAPI', companyName: 'Ansal Properties & Infrastructure Ltd', isin: 'INE436A01026', type: 'Equity' },
  { scripCode: '517059', symbol: 'SALZERELEC', companyName: 'Salzer Electronics Ltd', isin: 'INE457F01013', type: 'Equity' },
  { scripCode: '500370', symbol: 'SALORAINTL', companyName: 'Salora International Ltd', isin: 'INE924A01013', type: 'Equity' },
  { scripCode: '532497', symbol: 'RADICO', companyName: 'Radico Khaitan Ltd', isin: 'INE944F01028', type: 'Equity' },
  { scripCode: '500325', symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd', isin: 'INE002A01018', type: 'Equity' },
  { scripCode: '532540', symbol: 'TCS', companyName: 'Tata Consultancy Services Ltd', isin: 'INE467B01029', type: 'Equity' },
  { scripCode: '500180', symbol: 'HDFCBANK', companyName: 'HDFC Bank Ltd', isin: 'INE040A01034', type: 'Equity' },
  { scripCode: '532174', symbol: 'ICICIBANK', companyName: 'ICICI Bank Ltd', isin: 'INE090A01021', type: 'Equity' },
  { scripCode: '500209', symbol: 'INFY', companyName: 'Infosys Ltd', isin: 'INE009A01021', type: 'Equity' },
  { scripCode: '500696', symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Ltd', isin: 'INE030A01027', type: 'Equity' },
  { scripCode: '500112', symbol: 'SBIN', companyName: 'State Bank of India', isin: 'INE062A01020', type: 'Equity' },
  { scripCode: '532215', symbol: 'AXISBANK', companyName: 'Axis Bank Ltd', isin: 'INE238A01034', type: 'Equity' },
  { scripCode: '500875', symbol: 'ITC', companyName: 'ITC Ltd', isin: 'INE154A01025', type: 'Equity' },
  { scripCode: '500247', symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank Ltd', isin: 'INE237A01028', type: 'Equity' },
  { scripCode: '500510', symbol: 'LT', companyName: 'Larsen & Toubro Ltd', isin: 'INE018A01030', type: 'Equity' },
  { scripCode: '532454', symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Ltd', isin: 'INE397D01024', type: 'Equity' },
  { scripCode: '500182', symbol: 'HEROMOTOCO', companyName: 'Hero MotoCorp Ltd', isin: 'INE158A01026', type: 'Equity' },
  { scripCode: '500570', symbol: 'TATAMOTORS', companyName: 'Tata Motors Ltd', isin: 'INE155A01022', type: 'Equity' },
  { scripCode: '500400', symbol: 'TATAPOWER', companyName: 'Tata Power Company Ltd', isin: 'INE245A01021', type: 'Equity' },
  { scripCode: '500470', symbol: 'TATASTEEL', companyName: 'Tata Steel Ltd', isin: 'INE081A01020', type: 'Equity' },
  { scripCode: '500790', symbol: 'NESTLEIND', companyName: 'Nestle India Ltd', isin: 'INE239A01024', type: 'Equity' },
  { scripCode: '500124', symbol: 'DRREDDY', companyName: 'Dr. Reddy\'s Laboratories Ltd', isin: 'INE089A01023', type: 'Equity' },
  { scripCode: '524715', symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries Ltd', isin: 'INE044A01036', type: 'Equity' },
  { scripCode: '532500', symbol: 'MARUTI', companyName: 'Maruti Suzuki India Ltd', isin: 'INE585B01010', type: 'Equity' },
  { scripCode: '500520', symbol: 'M&M', companyName: 'Mahindra & Mahindra Ltd', isin: 'INE101A01026', type: 'Equity' },
  { scripCode: '500034', symbol: 'BAJFINANCE', companyName: 'Bajaj Finance Ltd', isin: 'INE296A01024', type: 'Equity' },
  { scripCode: '532978', symbol: 'BAJAJFINSV', companyName: 'Bajaj Finserv Ltd', isin: 'INE918I01026', type: 'Equity' },
  { scripCode: '532868', symbol: 'DLF', companyName: 'DLF Ltd', isin: 'INE271C01023', type: 'Equity' },
  { scripCode: '500295', symbol: 'VEDL', companyName: 'Vedanta Ltd', isin: 'INE205A01025', type: 'Equity' },
  { scripCode: '512599', symbol: 'ADANIENT', companyName: 'Adani Enterprises Ltd', isin: 'INE423A01024', type: 'Equity' },
  { scripCode: '532921', symbol: 'ADANIPORTS', companyName: 'Adani Ports & Special Economic Zone Ltd', isin: 'INE742F01042', type: 'Equity' },
  { scripCode: '533096', symbol: 'ADANIPOWER', companyName: 'Adani Power Ltd', isin: 'INE814H01011', type: 'Equity' },
  { scripCode: '542066', symbol: 'ATGL', companyName: 'Adani Total Gas Ltd', isin: 'INE399L01023', type: 'Equity' },
  { scripCode: '541450', symbol: 'ADANIGREEN', companyName: 'Adani Green Energy Ltd', isin: 'INE364U01010', type: 'Equity' },
  { scripCode: '500820', symbol: 'ASIANPAINT', companyName: 'Asian Paints Ltd', isin: 'INE021A01026', type: 'Equity' },
  { scripCode: '500114', symbol: 'TITAN', companyName: 'Titan Company Ltd', isin: 'INE280A01028', type: 'Equity' },
  { scripCode: '500410', symbol: 'BACC', companyName: 'ACC Ltd', isin: 'INE012A01025', type: 'Equity' },
  { scripCode: '500425', symbol: 'AMBUJACEM', companyName: 'Ambuja Cements Ltd', isin: 'INE079A01024', type: 'Equity' },
  { scripCode: '532538', symbol: 'ULTRACEMCO', companyName: 'UltraTech Cement Ltd', isin: 'INE481G01011', type: 'Equity' },
  { scripCode: '500530', symbol: 'BOSCHLTD', companyName: 'Bosch Ltd', isin: 'INE323A01026', type: 'Equity' },
  { scripCode: '500440', symbol: 'HINDALCO', companyName: 'Hindalco Industries Ltd', isin: 'INE038A01020', type: 'Equity' },
  { scripCode: '500228', symbol: 'JSWSTEEL', companyName: 'JSW Steel Ltd', isin: 'INE019A01038', type: 'Equity' },
  { scripCode: '500104', symbol: 'HINDPETRO', companyName: 'Hindustan Petroleum Corporation Ltd', isin: 'INE094A01015', type: 'Equity' },
  { scripCode: '500547', symbol: 'BPCL', companyName: 'Bharat Petroleum Corporation Ltd', isin: 'INE029A01011', type: 'Equity' },
  { scripCode: '530965', symbol: 'IOC', companyName: 'Indian Oil Corporation Ltd', isin: 'INE242A01010', type: 'Equity' },
  { scripCode: '500312', symbol: 'ONGC', companyName: 'Oil & Natural Gas Corporation Ltd', isin: 'INE213A01029', type: 'Equity' },
  { scripCode: '532555', symbol: 'NTPC', companyName: 'NTPC Ltd', isin: 'INE733E01010', type: 'Equity' },
  { scripCode: '532898', symbol: 'POWERGRID', companyName: 'Power Grid Corporation of India Ltd', isin: 'INE752E01010', type: 'Equity' },
  { scripCode: '532155', symbol: 'GAIL', companyName: 'GAIL (India) Ltd', isin: 'INE129A01019', type: 'Equity' },
  { scripCode: '532755', symbol: 'TECHM', companyName: 'Tech Mahindra Ltd', isin: 'INE669C01036', type: 'Equity' },
  { scripCode: '507685', symbol: 'WIPRO', companyName: 'Wipro Ltd', isin: 'INE075A01022', type: 'Equity' },
  { scripCode: '532281', symbol: 'HCLTECH', companyName: 'HCL Technologies Ltd', isin: 'INE860A01027', type: 'Equity' },
  { scripCode: '534816', symbol: 'INDIGO', companyName: 'InterGlobe Aviation Ltd', isin: 'INE646L01027', type: 'Equity' },
  { scripCode: '532321', symbol: 'CADILAHC', companyName: 'Zydus Lifesciences Ltd', isin: 'INE010B01027', type: 'Equity' },
  { scripCode: '500087', symbol: 'CIPLA', companyName: 'Cipla Ltd', isin: 'INE059A01026', type: 'Equity' },
  { scripCode: '500124', symbol: 'DIVISLAB', companyName: 'Divi\'s Laboratories Ltd', isin: 'INE361B01024', type: 'Equity' },
  { scripCode: '532523', symbol: 'BIOCON', companyName: 'Biocon Ltd', isin: 'INE376G01013', type: 'Equity' },
  { scripCode: '500165', symbol: 'KANSAINER', companyName: 'Kansai Nerolac Paints Ltd', isin: 'INE531A01024', type: 'Equity' },
  { scripCode: '500043', symbol: 'BATAINDIA', companyName: 'Bata India Ltd', isin: 'INE176A01028', type: 'Equity' },
  { scripCode: '500477', symbol: 'ASHOKLEY', companyName: 'Ashok Leyland Ltd', isin: 'INE208A01029', type: 'Equity' },
  { scripCode: '532343', symbol: 'TVSMOTOR', companyName: 'TVS Motor Company Ltd', isin: 'INE494B01023', type: 'Equity' },
  { scripCode: '500490', symbol: 'BAJAJ-AUTO', companyName: 'Bajaj Auto Ltd', isin: 'INE917I01010', type: 'Equity' },
  { scripCode: '500188', symbol: 'HINDZINC', companyName: 'Hindustan Zinc Ltd', isin: 'INE267A01025', type: 'Equity' },
  { scripCode: '533278', symbol: 'COALINDIA', companyName: 'Coal India Ltd', isin: 'INE522F01014', type: 'Equity' },
  { scripCode: '500268', symbol: 'MANAPPURAM', companyName: 'Manappuram Finance Ltd', isin: 'INE522D01027', type: 'Equity' },
  { scripCode: '532955', symbol: 'RECLTD', companyName: 'REC Ltd', isin: 'INE020B01018', type: 'Equity' },
  { scripCode: '532810', symbol: 'PFC', companyName: 'Power Finance Corporation Ltd', isin: 'INE134E01011', type: 'Equity' },
  { scripCode: '532461', symbol: 'PNB', companyName: 'Punjab National Bank', isin: 'INE160A01022', type: 'Equity' },
  { scripCode: '532134', symbol: 'BANKBARODA', companyName: 'Bank of Baroda', isin: 'INE028A01039', type: 'Equity' },
  { scripCode: '532483', symbol: 'CANBK', companyName: 'Canara Bank', isin: 'INE476A01014', type: 'Equity' },
  { scripCode: '532477', symbol: 'UNIONBANK', companyName: 'Union Bank of India', isin: 'INE692A01016', type: 'Equity' },
  { scripCode: '532210', symbol: 'CUB', companyName: 'City Union Bank Ltd', isin: 'INE491A01021', type: 'Equity' },
  { scripCode: '532187', symbol: 'INDUSINDBK', companyName: 'IndusInd Bank Ltd', isin: 'INE095A01012', type: 'Equity' },
  { scripCode: '532648', symbol: 'YESBANK', companyName: 'Yes Bank Ltd', isin: 'INE528G01035', type: 'Equity' },
  { scripCode: '539437', symbol: 'IDFCFIRSTB', companyName: 'IDFC First Bank Ltd', isin: 'INE092T01019', type: 'Equity' },
  { scripCode: '540716', symbol: 'ICICIGI', companyName: 'ICICI Lombard General Insurance Co Ltd', isin: 'INE765G01017', type: 'Equity' },
  { scripCode: '540777', symbol: 'HDFCLIFE', companyName: 'HDFC Life Insurance Co Ltd', isin: 'INE795G01014', type: 'Equity' },
  { scripCode: '540133', symbol: 'ICICIPRULI', companyName: 'ICICI Prudential Life Insurance Co Ltd', isin: 'INE726G01019', type: 'Equity' },
  { scripCode: '540719', symbol: 'SBILIFE', companyName: 'SBI Life Insurance Co Ltd', isin: 'INE123W01016', type: 'Equity' },
  { scripCode: '542649', symbol: 'RVNL', companyName: 'Rail Vikas Nigam Ltd', isin: 'INE415G01027', type: 'Equity' },
  { scripCode: '542830', symbol: 'IRCTC', companyName: 'Indian Railway Catering & Tourism Corp Ltd', isin: 'INE335Y01020', type: 'Equity' },
  { scripCode: '541154', symbol: 'HAL', companyName: 'Hindustan Aeronautics Ltd', isin: 'INE066F01020', type: 'Equity' },
  { scripCode: '541557', symbol: 'BDL', companyName: 'Bharat Dynamics Ltd', isin: 'INE171Z01026', type: 'Equity' },
  { scripCode: '500049', symbol: 'BEL', companyName: 'Bharat Electronics Ltd', isin: 'INE263A01024', type: 'Equity' },
  { scripCode: '533260', symbol: 'SUZLON', companyName: 'Suzlon Energy Ltd', isin: 'INE040H01021', type: 'Equity' },
  { scripCode: '513023', symbol: 'NAVA', companyName: 'Nava Ltd', isin: 'INE725A01024', type: 'Equity' },
  { scripCode: '500290', symbol: 'MRF', companyName: 'MRF Ltd', isin: 'INE883A01011', type: 'Equity' },
  { scripCode: '500331', symbol: 'PIDILITIND', companyName: 'Pidilite Industries Ltd', isin: 'INE318A01026', type: 'Equity' }
];

export function searchLocalBseMaster(query: string, limit = 25): BseMasterEquity[] {
  const cleanQ = query.trim().toUpperCase();
  if (!cleanQ) return [];

  return BSE_TOP_EQUITIES.map(stock => {
    let score = 0;
    const symUpper = stock.symbol.toUpperCase();
    const nameUpper = stock.companyName.toUpperCase();
    const code = stock.scripCode;

    if (code === cleanQ || symUpper === cleanQ) {
      score += 150;
    } else if (symUpper.startsWith(cleanQ)) {
      score += 100;
    } else if (nameUpper.startsWith(cleanQ)) {
      score += 80;
    } else if (symUpper.includes(cleanQ)) {
      score += 50;
    } else if (nameUpper.includes(cleanQ)) {
      score += 40;
    } else if (code.includes(cleanQ)) {
      score += 30;
    }

    return { stock, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit)
  .map(item => item.stock);
}
