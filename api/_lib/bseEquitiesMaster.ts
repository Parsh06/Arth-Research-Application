// api/_lib/bseEquitiesMaster.ts
/**
 * Curated high-reliability BSE Equity Securities Master Registry
 * Acts as an ultra-fast resilient search provider and offline fallback
 * ensuring that stock search NEVER fails even during BSE network spikes or serverless IP restrictions.
 */

export interface BseMasterEquity {
  scripCode: string;
  symbol: string;
  companyName: string;
  isin: string;
  type: string;
}

export const BSE_TOP_EQUITIES: BseMasterEquity[] = [
  // A & S Group / Popular
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
  { scripCode: '533151', symbol: 'DBREALTY', companyName: 'Valor Estate Ltd (DB Realty)', isin: 'INE879I01012', type: 'Equity' },
  { scripCode: '532822', symbol: 'IDEA', companyName: 'Vodafone Idea Ltd', isin: 'INE669E01016', type: 'Equity' },
  { scripCode: '542649', symbol: 'RVNL', companyName: 'Rail Vikas Nigam Ltd', isin: 'INE415G01027', type: 'Equity' },
  { scripCode: '542830', symbol: 'IRCTC', companyName: 'Indian Railway Catering & Tourism Corp Ltd', isin: 'INE335Y01020', type: 'Equity' },
  { scripCode: '541154', symbol: 'HAL', companyName: 'Hindustan Aeronautics Ltd', isin: 'INE066F01020', type: 'Equity' },
  { scripCode: '541557', symbol: 'BDL', companyName: 'Bharat Dynamics Ltd', isin: 'INE171Z01026', type: 'Equity' },
  { scripCode: '500049', symbol: 'BEL', companyName: 'Bharat Electronics Ltd', isin: 'INE263A01024', type: 'Equity' },
  { scripCode: '540755', symbol: 'GICRE', companyName: 'General Insurance Corporation of India', isin: 'INE481Y01014', type: 'Equity' },
  { scripCode: '532712', symbol: 'RCOM', companyName: 'Reliance Communications Ltd', isin: 'INE330H01018', type: 'Equity' },
  { scripCode: '533260', symbol: 'SUZLON', companyName: 'Suzlon Energy Ltd', isin: 'INE040H01021', type: 'Equity' },
  { scripCode: '532885', symbol: 'CENTRALBK', companyName: 'Central Bank of India', isin: 'INE562A01011', type: 'Equity' },
  { scripCode: '532134', symbol: 'IOB', companyName: 'Indian Overseas Bank', isin: 'INE565A01014', type: 'Equity' },
  { scripCode: '532149', symbol: 'BANKINDIA', companyName: 'Bank of India', isin: 'INE084A01016', type: 'Equity' },
  { scripCode: '532432', symbol: 'UCOBANK', companyName: 'UCO Bank', isin: 'INE691A01018', type: 'Equity' },
  { scripCode: '532525', symbol: 'MAHABANK', companyName: 'Bank of Maharashtra', isin: 'INE457A01014', type: 'Equity' },
  { scripCode: '513023', symbol: 'NAVA', companyName: 'Nava Ltd', isin: 'INE725A01024', type: 'Equity' },
  { scripCode: '500290', symbol: 'MRF', companyName: 'MRF Ltd', isin: 'INE883A01011', type: 'Equity' },
  { scripCode: '500331', symbol: 'PIDILITIND', companyName: 'Pidilite Industries Ltd', isin: 'INE318A01026', type: 'Equity' },
  { scripCode: '500185', symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Ltd', isin: 'INE030A01027', type: 'Equity' },
  { scripCode: '500008', symbol: 'AMARAJABAT', companyName: 'Amara Raja Energy & Mobility Ltd', isin: 'INE885A01032', type: 'Equity' },
  { scripCode: '500002', symbol: 'ABB', companyName: 'ABB India Ltd', isin: 'INE117A01022', type: 'Equity' },
  { scripCode: '500003', symbol: 'AEGISCHEM', companyName: 'Aegis Logistics Ltd', isin: 'INE208C01025', type: 'Equity' },
  { scripCode: '500010', symbol: 'HDFC', companyName: 'Housing Development Finance Corp', isin: 'INE001A01036', type: 'Equity' },
  { scripCode: '500020', symbol: 'BOMDYEING', companyName: 'Bombay Dyeing & Mfg Co Ltd', isin: 'INE032A01023', type: 'Equity' },
  { scripCode: '500027', symbol: 'ATUL', companyName: 'Atul Ltd', isin: 'INE100A01010', type: 'Equity' },
  { scripCode: '500031', symbol: 'BAJAJELEC', companyName: 'Bajaj Electricals Ltd', isin: 'INE193E01025', type: 'Equity' },
  { scripCode: '500038', symbol: 'BALRAMCHIN', companyName: 'Balrampur Chini Mills Ltd', isin: 'INE119A01028', type: 'Equity' },
  { scripCode: '500040', symbol: 'CENTURYTEX', companyName: 'Century Textiles & Industries Ltd', isin: 'INE055A01016', type: 'Equity' },
  { scripCode: '500048', symbol: 'BBL', companyName: 'Bharat Bijlee Ltd', isin: 'INE464A01028', type: 'Equity' },
  { scripCode: '500052', symbol: 'BHANSALI', companyName: 'Bhansali Engineering Polymers Ltd', isin: 'INE922A01025', type: 'Equity' },
  { scripCode: '500055', symbol: 'BINDALAGRO', companyName: 'Oswal Chemicals & Fertilizers Ltd', isin: 'INE143A01010', type: 'Equity' },
  { scripCode: '500060', symbol: 'BIRLACABLE', companyName: 'Birla Cable Ltd', isin: 'INE800A01015', type: 'Equity' },
  { scripCode: '500067', symbol: 'BLUESTARCO', companyName: 'Blue Star Ltd', isin: 'INE472A01039', type: 'Equity' },
  { scripCode: '500068', symbol: 'DISHTV', companyName: 'Dish TV India Ltd', isin: 'INE836F01026', type: 'Equity' },
  { scripCode: '500085', symbol: 'CHAMBLFERT', companyName: 'Chambal Fertilisers & Chemicals Ltd', isin: 'INE085A01013', type: 'Equity' },
  { scripCode: '500092', symbol: 'CRISIL', companyName: 'CRISIL Ltd', isin: 'INE007A01025', type: 'Equity' },
  { scripCode: '500093', symbol: 'CGPOWER', companyName: 'CG Power and Industrial Solutions Ltd', isin: 'INE067A01029', type: 'Equity' },
  { scripCode: '500096', symbol: 'DABUR', companyName: 'Dabur India Ltd', isin: 'INE016A01026', type: 'Equity' },
  { scripCode: '500101', symbol: 'ARVIND', companyName: 'Arvind Ltd', isin: 'INE034A01011', type: 'Equity' },
  { scripCode: '500102', symbol: 'BALLARPUR', companyName: 'Ballarpur Industries Ltd', isin: 'INE294A01037', type: 'Equity' },
  { scripCode: '500103', symbol: 'BHEL', companyName: 'Bharat Heavy Electricals Ltd', isin: 'INE257A01026', type: 'Equity' },
  { scripCode: '500111', symbol: 'RELIANCECAP', companyName: 'Reliance Capital Ltd', isin: 'INE013A01015', type: 'Equity' },
  { scripCode: '500113', symbol: 'SAIL', companyName: 'Steel Authority of India Ltd', isin: 'INE114A01011', type: 'Equity' },
  { scripCode: '500116', symbol: 'IDBI', companyName: 'IDBI Bank Ltd', isin: 'INE008A01015', type: 'Equity' },
  { scripCode: '500120', symbol: 'DIAMINES', companyName: 'Diamines & Chemicals Ltd', isin: 'INE591E01018', type: 'Equity' },
  { scripCode: '500125', symbol: 'EIDPARRY', companyName: 'E.I.D. Parry (India) Ltd', isin: 'INE126A01031', type: 'Equity' },
  { scripCode: '500126', symbol: 'PGHL', companyName: 'Procter & Gamble Health Ltd', isin: 'INE199A01012', type: 'Equity' },
  { scripCode: '500133', symbol: 'ESABINDIA', companyName: 'ESAB India Ltd', isin: 'INE284A01012', type: 'Equity' },
  { scripCode: '500135', symbol: 'ESCORTS', companyName: 'Escorts Kubota Ltd', isin: 'INE042A01014', type: 'Equity' },
  { scripCode: '500144', symbol: 'FINCABLES', companyName: 'Finolex Cables Ltd', isin: 'INE235A01022', type: 'Equity' },
  { scripCode: '500150', symbol: 'FOSECOIND', companyName: 'Foseco India Ltd', isin: 'INE519A01011', type: 'Equity' },
  { scripCode: '500160', symbol: 'GTL', companyName: 'GTL Ltd', isin: 'INE043A01012', type: 'Equity' },
  { scripCode: '500163', symbol: 'GODFRYPHLP', companyName: 'Godfrey Phillips India Ltd', isin: 'INE260B01028', type: 'Equity' },
  { scripCode: '500164', symbol: 'GODREJIND', companyName: 'Godrej Industries Ltd', isin: 'INE233A01035', type: 'Equity' },
  { scripCode: '500170', symbol: 'GTNINDS', companyName: 'GTN Industries Ltd', isin: 'INE500A01019', type: 'Equity' },
  { scripCode: '500171', symbol: 'GHCL', companyName: 'GHCL Ltd', isin: 'INE539A01019', type: 'Equity' },
  { scripCode: '500179', symbol: 'HCL-INSYS', companyName: 'HCL Infosystems Ltd', isin: 'INE236A01020', type: 'Equity' },
  { scripCode: '500183', symbol: 'HFCL', companyName: 'HFCL Ltd', isin: 'INE548A01028', type: 'Equity' },
  { scripCode: '500186', symbol: 'HINDORCHM', companyName: 'Hindustan Organic Chemicals Ltd', isin: 'INE048A01011', type: 'Equity' },
  { scripCode: '500193', symbol: 'HLVTD', companyName: 'HLV Ltd (Hotel Leela)', isin: 'INE102A01024', type: 'Equity' },
  { scripCode: '500199', symbol: 'IGPL', companyName: 'I G Petrochemicals Ltd', isin: 'INE204A01010', type: 'Equity' },
  { scripCode: '500201', symbol: 'INDIAGLYCO', companyName: 'India Glycols Ltd', isin: 'INE560A01015', type: 'Equity' },
  { scripCode: '500202', symbol: 'INDSWFTLTD', companyName: 'Ind-Swift Ltd', isin: 'INE788A01017', type: 'Equity' },
  { scripCode: '500210', symbol: 'INGERRAND', companyName: 'Ingersoll-Rand (India) Ltd', isin: 'INE177A01018', type: 'Equity' },
  { scripCode: '500214', symbol: 'IONEXCHANG', companyName: 'Ion Exchange (India) Ltd', isin: 'INE570A01022', type: 'Equity' },
  { scripCode: '500219', symbol: 'JASCH', companyName: 'Jasch Industries Ltd', isin: 'INE712A01012', type: 'Equity' },
  { scripCode: '500220', symbol: 'JOCIL', companyName: 'Jocil Ltd', isin: 'INE808A01014', type: 'Equity' },
  { scripCode: '500227', symbol: 'JINDALPOLY', companyName: 'Jindal Poly Films Ltd', isin: 'INE197D01010', type: 'Equity' },
  { scripCode: '500231', symbol: 'UMANGDAIR', companyName: 'Umang Dairies Ltd', isin: 'INE864B01027', type: 'Equity' },
  { scripCode: '500233', symbol: 'KAJARIACER', companyName: 'Kajaria Ceramics Ltd', isin: 'INE217B01036', type: 'Equity' },
  { scripCode: '500238', symbol: 'WHIRLPOOL', companyName: 'Whirlpool of India Ltd', isin: 'INE716A01013', type: 'Equity' },
  { scripCode: '500243', symbol: 'KIRLOSIND', companyName: 'Kirloskar Industries Ltd', isin: 'INE250A01039', type: 'Equity' },
  { scripCode: '500245', symbol: 'KIRLOSBROS', companyName: 'Kirloskar Brothers Ltd', isin: 'INE732A01036', type: 'Equity' },
  { scripCode: '500249', symbol: 'KSB', companyName: 'KSB Ltd', isin: 'INE999A01015', type: 'Equity' },
  { scripCode: '500251', symbol: 'TRENT', companyName: 'Trent Ltd', isin: 'INE849A01020', type: 'Equity' },
  { scripCode: '500252', symbol: 'LAXMIMACH', companyName: 'Lakshmi Machine Works Ltd', isin: 'INE269A01021', type: 'Equity' },
  { scripCode: '500253', symbol: 'LICHSGFIN', companyName: 'LIC Housing Finance Ltd', isin: 'INE115A01026', type: 'Equity' },
  { scripCode: '500257', symbol: 'LUPIN', companyName: 'Lupin Ltd', isin: 'INE326A01037', type: 'Equity' },
  { scripCode: '500260', symbol: 'RAMCOCEM', companyName: 'The Ramco Cements Ltd', isin: 'INE331A01037', type: 'Equity' },
  { scripCode: '500265', symbol: 'MAHSCOOTER', companyName: 'Maharashtra Scooters Ltd', isin: 'INE288A01029', type: 'Equity' },
  { scripCode: '500266', symbol: 'MAHSEAMLES', companyName: 'Maharashtra Seamless Ltd', isin: 'INE271B01025', type: 'Equity' },
  { scripCode: '500271', symbol: 'MFSL', companyName: 'Max Financial Services Ltd', isin: 'INE180A01020', type: 'Equity' },
  { scripCode: '500280', symbol: 'CENTUM', companyName: 'Centum Electronics Ltd', isin: 'INE320B01020', type: 'Equity' },
  { scripCode: '500285', symbol: 'SPICEJET', companyName: 'SpiceJet Ltd', isin: 'INE285B01017', type: 'Equity' },
  { scripCode: '500298', symbol: 'OFSS', companyName: 'Oracle Financial Services Software Ltd', isin: 'INE881D01027', type: 'Equity' },
  { scripCode: '500300', symbol: 'GRASIM', companyName: 'Grasim Industries Ltd', isin: 'INE047A01021', type: 'Equity' },
  { scripCode: '500302', symbol: 'PEL', companyName: 'Piramal Enterprises Ltd', isin: 'INE140A01024', type: 'Equity' },
  { scripCode: '500304', symbol: 'NIITLTD', companyName: 'NIIT Ltd', isin: 'INE161A01038', type: 'Equity' }
];

/**
 * Searches the curated BSE master list with fuzzy relevance scoring.
 */
export function searchCuratedBseEquities(query: string, limit = 25) {
  const cleanQ = query.trim().toUpperCase();
  if (!cleanQ) return [];

  const scored = BSE_TOP_EQUITIES.map(stock => {
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

    return {
      scripCode: stock.scripCode,
      symbol: stock.symbol,
      companyName: stock.companyName,
      isin: stock.isin,
      type: stock.type,
      score
    };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit)
  .map(({ score, ...item }) => item);

  return scored;
}
