const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
require('dotenv').config();
const Tesseract = require('tesseract.js');





const axios = require('axios'); // ✅ Add this import


const FMP_API_KEY = process.env.FMP_API_KEY;
console.log('✅ FMP API KEY:', FMP_API_KEY); // move this here, after declaration

const yf = require('yahoo-finance2').default;

const userController = require("./userController/userController");
const { userSchemaModel } = require('./userController/userModel');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/reports', express.static(path.join(__dirname, 'reports')));

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

mongoose.connect("mongodb://localhost:27017/StockLLM", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

// User routes
app.post("/user/signup", userController.userCreate);
app.post("/user/login", userController.userLogin);
app.post('/user/details', userController.userDetails);


// Helper to extract JSON from markdown-like Gemini AI response
function extractJsonFromMarkdown(rawText) {
  // Try to extract JSON inside ```json ... ``` fences
  const codeFenceMatch = rawText.match(/```json([\s\S]*?)```/i);
  if (codeFenceMatch && codeFenceMatch[1]) {
    return codeFenceMatch[1].trim();
  }
  // Try to find a JSON array anywhere in text
  const jsonArrayMatch = rawText.match(/\[.*\]/s);
  if (jsonArrayMatch) {
    return jsonArrayMatch[0];
  }
  // If none found, return null
  return null;
}

// Generate portfolio report from screenshots
app.post('/generate-report', upload.array('screenshots'), async (req, res) => {
  const goal = req.body.goal;
  const files = req.files;
  const email = req.body.email;

  if (!goal || !files || files.length === 0 || !email) {
    return res.status(400).json({ error: 'Missing goal, screenshots, or email' });
  }

  try {
    const imageParts = files.map(file => ({
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString('base64'),
      }
    }));

    const prompt = `
You are a professional financial advisor AI. Your ONLY task is to analyze the user's investment portfolio using **ONLY AND EXCLUSIVELY** the data **DIRECTLY VISIBLE** in the uploaded screenshots. You must not use any external knowledge, assume any information, or hallucinate. If a piece of data is not visible, you MUST state "N/A" or "Not visible in screenshot."

USER GOAL: "${goal}"

INSTRUCTIONS:
- Generate a report with EXACTLY 8 sections.
- Use the precise titles and formatting: 1. *Section Title*.
- Each section (1-7) should be 2-4 short paragraphs.
- **Crucially, for sections 2, 3, 4, and 5, you must provide a direct answer or assessment based on the best inferences possible from the visible screenshot data, even if full context is missing. Clearly explain the reasoning and state any necessary assumptions.**
- Section 8 MUST be a markdown table containing ONLY the assets and data visible in the screenshot.

REQUIRED SECTIONS:
1. *Summary & Portfolio Characteristics*
2. *Goal Alignment Grade*
3. *Goal Alignment Percentage*
4. *Risk Meter*
5. *Estimated 5-Year Return*
6. *Where You Are Strong*
7. *Where You Need to Improve*
8. *Asset Allocation Breakdown*

SECTION 8 FORMAT:
- Create a Markdown table.
- **INCLUDE ONLY ASSETS THAT ARE VISIBLE IN THE 'HOLDINGS' TABLE OF THE SCREENSHOT.**
- **DO NOT INCLUDE ANY ASSETS NOT DIRECTLY SEEN IN THE PROVIDED IMAGES.**
- Use these exact column headers: "Asset Name", "Type", "Invested Amount", "Current Value".
  - **Asset Name:** Extract the exact text from the 'Instrument' column.
  - **Type:** For every asset visible in this table, its Type is 'Stock'.
  - **Invested Amount:** **CALCULATE THIS EXPLICITLY.** Multiply the value from the 'Qty' column by the value from the 'Avg. cost' column for each row. Format as currency (e.g., ₹1234.56). **If 'Qty' or 'Avg. cost' is NOT clearly visible for a specific row, then write "N/A" for that row's 'Invested Amount'.**
  - **Current Value:** Extract the exact numerical value from the 'Cur. val' column. Format as currency (e.g., ₹1234.56).
- The table must contain ALL rows visible in the 'Holdings' section of the screenshot.
- Example of Section 8 (populate this with actual data extracted from the screenshot):
Asset Name | Type | Invested Amount | Current Value
-----------|------|-----------------|--------------
PAYTM      | Stock| ₹49684.80       | ₹11251.35
SUVIDHAA   | Stock| ₹54068.72       | ₹19703.76
HAPPSTMNDS | Stock| ₹25803.00       | ₹14563.80
POLYPLEX   | Stock| ₹25553.70       | ₹15316.20
CARTTRADE  | Stock| ₹25273.90       | ₹15265.15
(and so on for any other stock clearly visible in the screenshot table)

**Specific Guidance for Sections 2, 3, 4, 5:**

**2. *Goal Alignment Grade***
- **Assign a letter grade (A, B, C, or D)** based on the visible assets and their performance relative to a typical 'building wealth' goal, assuming a moderately aggressive, long-term approach.
- **Explain your reasoning:** Reference specific visible portfolio characteristics (e.g., presence of high-growth potential stocks, significant P&L swings, diversification levels) that led to this grade. State that this is a preliminary grade based solely on the screenshot.

**3. *Goal Alignment Percentage***
- **Provide a qualitative percentage assessment or a broad range.** Example: "Low alignment (0-30%)", "Moderate alignment (30-70%)", or "High alignment (70-100%)". Do not attempt a precise numerical calculation.
- **Explain your reasoning:** Connect the visible portfolio's characteristics to this percentage, acknowledging missing context like exact financial targets.

**4. *Risk Meter***
- **Assign a clear risk level:** Choose from "Very Low," "Low," "Moderate," "High," or "Very High."
- **Justify your assessment:** Point to specific visible assets (e.g., individual stocks, significant unrealized losses) and the overall composition that indicate this risk level.

**5. *Estimated 5-Year Return***
- **Provide a qualitative assessment of potential return:** Examples: "Aggressive Growth Potential," "Moderate Growth Potential," "Limited Growth Potential," or "Uncertain Growth Potential." **DO NOT give a specific numerical percentage.**
- **Explain your reasoning:** Base this on the visible asset types (e.g., growth stocks vs. stable assets) and the general market conditions implied by current P&L, acknowledging that this is a speculative estimate from limited data.
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 3000,
      },
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          ...imageParts
        ],
      }]
    });

    const rawReport = result.response.text();
    const report = cleanAndValidateReport(rawReport);
    const assetSection = extractAssetBreakdown(report);
    const assetList = parseAssets(assetSection);

    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    const filename = `${Date.now()}_${email.replace(/[@.]/g, '_')}_report.pdf`;
    const fullPath = path.join(reportsDir, filename);
    const publicPath = `reports/${filename}`;

    await generatePDF(report, fullPath);

const user = await userSchemaModel.findOneAndUpdate(
      { email },
      {
        $push: {
          reports: {
            reportName: `Investment Report - ${new Date().toLocaleDateString()}`,
            reportData: report,
            reportPdf: publicPath,
            assets: assetList
          }
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ report, pdfPath: publicPath });

  } catch (err) {
    console.error('❌ Error generating report:', err);
    res.status(500).json({
      error: 'Failed to generate report from screenshots.',
      message: err.message || 'Unknown error'
    });
  }
});


// PDF generation helper

function generatePDF(text, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.font('Helvetica').fontSize(12);

    const sectionColors = {
      1: '#2c3e50', 2: '#2980b9', 3: '#27ae60',
      4: '#d35400', 5: '#8e44ad', 6: '#16a085', 7: '#c0392b', 8: '#7f8c8d'
    };

    const lines = text.split('\n');
    let currentSection = 0;

    for (let line of lines) {
      const match = line.match(/^(\d)\.\s\*(.*?)\*/);
      if (match) {
        currentSection = match[1];
        const sectionTitle = match[2].trim();
        doc.moveDown(1)
          .fillColor(sectionColors[currentSection] || '#000')
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(`${match[1]}. ${sectionTitle}`, { underline: true })
          .moveDown(0.5)
          .fontSize(12)
          .fillColor('black')
          .font('Helvetica');
      } else {
        doc.text(line, { lineGap: 4 });
      }
    }

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}

// Clean and validate the AI-generated report to keep expected 8 sections
function cleanAndValidateReport(report) {
  report = report.trim().replace(/\r\n/g, '\n');
  const lines = report.split('\n');
  const expectedSections = [
    /^1\.\s*\*.*Summary.*Portfolio.*\*/i,
    /^2\.\s*\*.*Goal.*Alignment.*Grade.*\*/i,
    /^3\.\s*\*.*Goal.*Alignment.*Percentage.*\*/i,
    /^4\.\s*\*.*Risk.*Meter.*\*/i,
    /^5\.\s*\*.*Estimated.*5.*Year.*Return.*\*/i,
    /^6\.\s*\*.*Where.*Strong.*\*/i,
    /^7\.\s*\*.*Where.*Improve.*\*/i,
    /^8\.\s*\*.*Asset.*Allocation.*Breakdown.*\*/i
  ];

  let cleanedLines = [];
  let sectionCount = 0;
  let foundStart = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!foundStart && !trimmed) continue;
    const matchIndex = expectedSections.findIndex(pattern => pattern.test(trimmed));
    if (matchIndex === sectionCount) {
      foundStart = true;
      sectionCount++;
      cleanedLines.push(line);
    } else if (foundStart) {
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n');
}

// Extract Section 8: Asset Allocation Breakdown markdown table
function extractAssetBreakdown(report) {
  const lines = report.split('\n');
  const startIndex = lines.findIndex(line =>
    /^8\.\s*\*Asset\s*Allocation\s*Breakdown\*/i.test(line)
  );
  if (startIndex === -1) return '';
  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (/^\d\.\s*\*/.test(lines[i])) {
      endIndex = i;
      break;
    }
  }
  return lines.slice(startIndex + 1, endIndex).join('\n');
}

// Parse markdown table rows of assets to JS objects
const parseAssets = (text) => {
  const rows = text
    .split('\n')
    .map(line => line.trim())
    .filter(line =>
      line &&
      line.includes('|') &&
      !line.toLowerCase().includes('asset name') &&
      !line.includes('----')
    );

  const parsedRows = [];

  for (const row of rows) {
    const parts = row.split('|').map(cell => cell.trim()).filter(Boolean);
    if (parts.length === 4) {
      parsedRows.push({
        name: parts[0],
        type: parts[1],
        invested: parts[2],
        value: parts[3]
      });
    }
  }

  return parsedRows;
};


// Map stock names to Yahoo Finance ticker symbols using Gemini AI
async function mapToYahooTickersWithGemini(names = []) {
  const prompt = `
      ${names.join('\n')}
  `;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  try {
    const cleanedJson = extractJsonFromMarkdown(raw);
    if (!cleanedJson) throw new Error("No JSON detected in Gemini response");
    const parsed = JSON.parse(cleanedJson);
    const map = {};
    parsed.forEach(entry => {
      if (entry.name && entry.ticker) {
        map[entry.name] = entry.ticker;
      }
    });
    return map;
  } catch (err) {
    console.error("Failed to parse Gemini ticker mapping:", err.message);
    return {};
  }
}
app.get('/search-stock', async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v1/finance/search?q=${query}`);
    
    const lowercaseQuery = query.toLowerCase();

    const results = response.data.quotes
      .filter(item => (item.exchange === 'NSI' || item.exchange === 'BSE') &&
        (
          item.symbol?.toLowerCase().includes(lowercaseQuery) ||
          item.shortname?.toLowerCase().includes(lowercaseQuery) ||
          item.longname?.toLowerCase().includes(lowercaseQuery) ||
          item.name?.toLowerCase().includes(lowercaseQuery)
        )
      )
      .map(item => ({
        symbol: item.symbol,
        name: item.shortname || item.longname || item.name || '',
        exchDisp: item.exchDisp || '',
      }));

    res.json(results);
  } catch (error) {
    console.error("❌ Error searching Yahoo Finance:", error.message);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

app.get('/market-data', async (req, res) => {
  try {
    // Index symbols for NIFTY and SENSEX
    const niftySymbol = '^NSEI';
    const sensexSymbol = '^BSESN';

    // Fetch quote data
    const [niftyData, sensexData] = await Promise.all([
      yf.quote(niftySymbol),
      yf.quote(sensexSymbol)
    ]);

    const response = {
      nifty: {
        price: niftyData.regularMarketPrice,
        change: niftyData.regularMarketChange,
        changePercent: niftyData.regularMarketChangePercent
      },
      sensex: {
        price: sensexData.regularMarketPrice,
        change: sensexData.regularMarketChange,
        changePercent: sensexData.regularMarketChangePercent
      },
      mood: (niftyData.regularMarketChange >= 0 && sensexData.regularMarketChange >= 0)
        ? 'Bullish'
        : (niftyData.regularMarketChange < 0 && sensexData.regularMarketChange < 0)
          ? 'Bearish'
          : 'Neutral'
    };

    res.json(response);

  } catch (err) {
    console.error('❌ Error fetching market data:', err.message);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});const niftyTop50 = [
  'ADANIPORTS.NS', 'ASIANPAINT.NS', 'AXISBANK.NS', 'BAJAJ-AUTO.NS', 'BAJFINANCE.NS',
  'BAJAJFINSV.NS', 'BPCL.NS', 'BHARTIARTL.NS', 'INFRATEL.NS', 'CIPLA.NS',
  'DRREDDY.NS', 'EICHERMOT.NS', 'GRASIM.NS', 'HCLTECH.NS', 'HDFC.NS',
  'HDFCBANK.NS', 'HDFCLIFE.NS', 'HEROMOTOCO.NS', 'HINDALCO.NS', 'HINDUNILVR.NS',
  'ICICIBANK.NS', 'ITC.NS', 'IOC.NS', 'INDUSINDBK.NS', 'INFY.NS',
  'JSWSTEEL.NS', 'KOTAKBANK.NS', 'LT.NS', 'M&M.NS', 'MARUTI.NS',
  'NESTLEIND.NS', 'NTPC.NS', 'ONGC.NS', 'POWERGRID.NS', 'RELIANCE.NS',
  'SBIN.NS', 'SHREECEM.NS', 'SUNPHARMA.NS', 'TCS.NS', 'TATAMOTORS.NS',
  'TATASTEEL.NS', 'TECHM.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'UPL.NS',
  'WIPRO.NS', 'DIVISLAB.NS', 'INDIGO.NS', 'COALINDIA.NS', 'GAIL.NS'
];

app.get('/nifty-top-companies', async (req, res) => {
  try {
    const quotes = await yf.quote(niftyTop50); // Make sure this returns all 50 stocks

    const result = quotes.map((q) => ({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent
    }));

    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching NIFTY top 50 companies:", err);
    res.status(500).json({ error: "Failed to fetch top companies" });
  }
});



app.get('/stock-details', async (req, res) => {
  let { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  if (!symbol.includes('.')) {
    symbol = symbol.toUpperCase() + '.NS'; // Add exchange suffix if missing
  }

  try {
    const data = await yf.quote(symbol);
    
    if (!data || Object.keys(data).length === 0) {
      return res.status(404).json({ error: `Stock data not found for symbol: ${symbol}` });
    }
    res.json(data);
  } catch (err) {
    console.error("Stock details fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});
async function getHistoricalData(symbol, from, to) {
  try {
    const history = await yf.historical(symbol, {
      period1: from,
      period2: to,
      interval: '1d',
    });

    const chartData = history.map(entry => ({
      date: entry.date.toISOString().split('T')[0],
      price: entry.close,
    }));

    return chartData;
  } catch (err) {
    console.error(`❌ Error fetching data for ${symbol}:`, err.message);
    return [];
  }
}
app.get('/stock-history', async (req, res) => {
  let { symbol, from, to } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  if (!from || !to) {
    return res.status(400).json({ error: 'Both from and to dates are required in YYYY-MM-DD format' });
  }

  if (!symbol.includes('.')) {
    symbol += '.NS';
  }

  try {
    const chartData = await getHistoricalData(symbol, from, to);
    if (chartData.length === 0) {
      return res.status(404).json({ error: 'No chart data found for symbol: ' + symbol });
    }
    res.json(chartData);
  } catch (err) {
    console.error("❌ Error in /stock-history:", err.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});


// Symbol formatter fallback
function getYahooSymbol(name) {
  if (symbolMap[name]) return symbolMap[name];
  if (!name.endsWith('.NS')) return name + '.NS';
  return name;
}

async function getCAGR(symbol, investedDate) {
  try {
    if (!investedDate || !symbol || symbol === "N/A") return "N/A";

    const today = new Date();
    const fromDate = new Date(investedDate);
    const from = fromDate.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];

    const result = await yf.historical(symbol, {
      period1: from,
      period2: to,
      interval: '1d'
    });

    if (!result || result.length < 2) {
      console.warn(`⚠️ No data for ${symbol} between ${from} and ${to}`);
      return "N/A";
    }

    result.sort((a, b) => new Date(a.date) - new Date(b.date));
    const startPrice = result[0]?.close;
    const endPrice = result[result.length - 1]?.close;
    if (!startPrice || !endPrice) return "N/A";

    const years = (today - fromDate) / (1000 * 60 * 60 * 24 * 365.25);
    const cagr = Math.pow(endPrice / startPrice, 1 / years) - 1;

    return (cagr * 100).toFixed(2) + "%";
  } catch (err) {
    console.error(`❌ Error fetching CAGR for ${symbol}:`, err.message);
    return "N/A";
  }
}

app.post('/analyze-returns', async (req, res) => {
  const stocks = req.body.stocks;
  if (!Array.isArray(stocks) || stocks.length === 0) {
    return res.status(400).json({ error: "Invalid or missing stock data." });
  }

  try {
    const assetNames = [...new Set(stocks.map(s => s.name))];
    const geminiMap = await mapToYahooTickersWithGemini(assetNames);

    const stockResults = await Promise.all(stocks.map(async (stock) => {
      const fallback = getYahooSymbol(stock.name);
      const geminiSymbol = geminiMap[stock.name];
      const finalSymbol = (geminiSymbol && geminiSymbol !== "N/A") ? geminiSymbol : fallback;

      const date = stock.investedDate || stock.date; // ensure compatibility

      let stockCAGR = "N/A";
      let niftyCAGR = "N/A";

      if (date) {
        stockCAGR = await getCAGR(finalSymbol, date);
        niftyCAGR = await getCAGR("^NSEI", date); // NIFTY index
      }

      return {
        name: stock.name,
        ticker: finalSymbol,
        investedDate: date,
        annualReturn: stockCAGR,
        niftyCAGR
      };
    }));
    console.log(stockResults);
    res.json({ returns: stockResults });
  } catch (error) {
    console.error("❌ Error in analyze-returns:", error);
    res.status(500).json({ error: "Failed to calculate CAGR." });
  }
});
app.get('/test-articles', async (req, res) => {
  try {
    const count = await Article.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Test articles error:', err);
    res.status(500).json({ error: err.message });
  }
});



app.get('/articles', async (req, res) => {
  try {
    if (!Article) {
      console.error("Article model is undefined!");
      return res.status(500).json({ error: "Article model not found" });
    }
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    console.error('GET /articles error:', err);
    res.status(500).json({ error: 'Failed to fetch articles', message: err.message });
  }
});


// POST /articles - create a new article
app.post('/articles', async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.status(201).json(article);
  } catch (err) {
    console.error('POST /articles error:', err);
    res.status(500).json({ error: 'Failed to save article', message: err.message });
  }
});
// Helper to extract JSON block from Gemini markdown response
function extractJsonFromMarkdown(rawText) {
  const match = rawText.match(/```json([\s\S]*?)```/);
  if (match && match[1]) return match[1].trim();

  const jsonMatch = rawText.match(/\[.*\]/s);
  return jsonMatch ? jsonMatch[0] : null;
}

// OCR: Extract text from all uploaded images
async function extractTextFromImages(files) {
  const allText = [];

  for (const file of files) {
    const { data: result } = await Tesseract.recognize(file.buffer, 'eng');
    allText.push(result.text);
  }

  return allText.join('\n');
}
// Route: POST /api/track-trade
app.post('/api/track-trade', upload.array('screenshots'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No screenshots uploaded' });
    }

    const rawText = await extractTextFromImages(files);
    const prompt = `
You are a stock portfolio analyzer AI. From the extracted text below, extract a list of investments using this exact JSON format:

[
  {
    "Stock Name": "XYZ",
    "Invested Date": "YYYY-MM-DD",
    "Invested Amount": "₹10000",
    "Current Value": "₹12000",
    "Profit or Loss": "N/A"
  }
]

If any field is missing or unclear, write "N/A".

\`\`\`
${rawText}
\`\`\`
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const geminiText = result.response.text();
    const extractedJson = extractJsonFromMarkdown(geminiText);

    if (!extractedJson) {
      return res.status(500).json({ error: 'Gemini AI did not return valid JSON' });
    }

    let parsedAssets;
    try {
      parsedAssets = JSON.parse(extractedJson);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON received from Gemini AI' });
    }

    const processedAssets = parsedAssets.map(asset => {
      const invested = parseFloat(asset['Invested Amount']?.replace(/[₹,]/g, '') || 'NaN');
      const current = parseFloat(asset['Current Value']?.replace(/[₹,]/g, '') || 'NaN');

      let profitLoss = "N/A";
      if (!isNaN(invested) && !isNaN(current)) {
        const diff = current - invested;
        profitLoss = (diff >= 0 ? '+' : '') + '₹' + diff.toFixed(2);
      }

      return {
        ...asset,
        'Profit or Loss': profitLoss,
      };
    });

    // ✅ Only return extracted data — don't store yet
    res.json({
      stored: false,
      text: JSON.stringify(processedAssets, null, 2),
      extracted: processedAssets
    });

  } catch (err) {
    console.error('❌ Error in /api/track-trade:', err.stack || err);
    res.status(500).json({ error: 'Failed to analyze screenshot.', message: err.message || 'Unknown error' });
  }
});
app.post('/api/save-portfolio', async (req, res) => {
  try {
    const { email, tradeData } = req.body;

    if (!email || !Array.isArray(tradeData)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const report = {
      reportName: `Trade Report - ${new Date().toISOString()}`,
      tradeEntries: tradeData.map(item => ({
        stockName: item['Stock Name'],
        investedDate: item['Invested Date'],
        investedAmount: item['Invested Amount'],
        currentValue: item['Current Value'],
        profitOrLoss: item['Profit or Loss']
      }))
    };

    user.reports.push(report);
    await user.save();

    res.json({ message: 'Portfolio saved successfully', report });

  } catch (err) {
    console.error('❌ Error saving portfolio:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

app.post('/api/portfolio-summary', async (req, res) => {
  try {
    const { email, from, to } = req.body;

    if (!email || !from || !to) {
      return res.status(400).json({ error: 'Missing email, from, or to date' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.reports) {
      return res.status(404).json({ error: 'User or reports not found' });
    }

    // Collect all relevant trade entries across reports
    let allTrades = [];
    user.reports.forEach(report => {
      if (report.tradeEntries && Array.isArray(report.tradeEntries)) {
        allTrades.push(...report.tradeEntries);
      }
    });

    const filtered = allTrades.filter(entry => {
      const date = new Date(entry.investedDate);
      return date >= new Date(from) && date <= new Date(to);
    });

    let totalInvested = 0;
    let totalCurrent = 0;

    for (const trade of filtered) {
      const invested = parseFloat(trade.investedAmount?.replace(/[₹,]/g, '') || '0');
      const current = parseFloat(trade.currentValue?.replace(/[₹,]/g, '') || '0');

      if (!isNaN(invested)) totalInvested += invested;
      if (!isNaN(current)) totalCurrent += current;
    }

    const profit = totalCurrent - totalInvested;
    const returnPercentage = totalInvested > 0
      ? ((profit / totalInvested) * 100).toFixed(2) + '%'
      : 'N/A';

    res.json({
      from,
      to,
      totalTrades: filtered.length,
      totalInvested: `₹${totalInvested.toFixed(2)}`,
      totalCurrentValue: `₹${totalCurrent.toFixed(2)}`,
      profit: `₹${profit.toFixed(2)}`,
      returnPercentage,
    });

  } catch (err) {
    console.error("❌ Error in /api/portfolio-summary:", err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

app.post('/api/profit-by-date', async (req, res) => {
  try {
    const { email, from, to } = req.body;

    if (!email || !from || !to) {
      return res.status(400).json({ error: 'Missing email, from, or to date' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.reports) {
      return res.status(404).json({ error: 'User or reports not found' });
    }

    const dailyData = {}; // { "2025-07-01": { invested: 1000, current: 1200 } }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid from or to date format' });
    }

    user.reports.forEach(report => {
      if (report.tradeEntries && Array.isArray(report.tradeEntries)) {
        report.tradeEntries.forEach(entry => {
          if (!entry.investedDate) return; // skip if no investedDate

          const date = new Date(entry.investedDate);
          if (isNaN(date.getTime())) return; // skip invalid dates

          if (date < fromDate || date > toDate) return; // skip dates outside range

          const key = date.toISOString().split('T')[0];

          const invested = parseFloat(entry.investedAmount?.replace(/[₹,]/g, '') || '0');
          const current = parseFloat(entry.currentValue?.replace(/[₹,]/g, '') || '0');

          if (!dailyData[key]) {
            dailyData[key] = { invested: 0, current: 0 };
          }

          if (!isNaN(invested)) dailyData[key].invested += invested;
          if (!isNaN(current)) dailyData[key].current += current;
        });
      }
    });

    // Convert dailyData object to sorted array with profit calculation
    const result = Object.entries(dailyData).map(([date, values]) => {
      const profit = values.current - values.invested;
      return { date, profit: parseFloat(profit.toFixed(2)) };
    });

    result.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(result);
  } catch (err) {
    console.error('❌ Error in /api/profit-by-date:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

app.post('/api/profit-by-date-per-stock', async (req, res) => {
  try {
    const { email, from, to } = req.body;

    if (!email || !from || !to) {
      return res.status(400).json({ error: 'Missing email, from, or to date' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.reports) {
      return res.status(404).json({ error: 'User or reports not found' });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid from or to date format' });
    }

    // Structure: { stockName: { "YYYY-MM-DD": { invested, current } } }
    const stockDailyData = {};

    user.reports.forEach(report => {
      if (report.tradeEntries && Array.isArray(report.tradeEntries)) {
        report.tradeEntries.forEach(entry => {
          const stockName = entry.stockName || entry['Stock Name'] || 'Unknown';

          if (!entry.investedDate) return; // skip if no date
          const date = new Date(entry.investedDate);
          if (isNaN(date.getTime())) return; // skip invalid date

          if (date < fromDate || date > toDate) return;

          const key = date.toISOString().split('T')[0];
          const invested = parseFloat(entry.investedAmount?.replace(/[₹,]/g, '') || '0');
          const current = parseFloat(entry.currentValue?.replace(/[₹,]/g, '') || '0');

          if (!stockDailyData[stockName]) {
            stockDailyData[stockName] = {};
          }

          if (!stockDailyData[stockName][key]) {
            stockDailyData[stockName][key] = { invested: 0, current: 0 };
          }

          if (!isNaN(invested)) stockDailyData[stockName][key].invested += invested;
          if (!isNaN(current)) stockDailyData[stockName][key].current += current;
        });
      }
    });

    // Convert to format: { stockName: [ { date, profit }, ... ] }
    const result = {};
    for (const [stockName, dates] of Object.entries(stockDailyData)) {
      const arr = Object.entries(dates)
        .map(([date, values]) => ({
          date,
          profit: parseFloat((values.current - values.invested).toFixed(2)),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      result[stockName] = arr;
    }

    res.json(result);
  } catch (err) {
    console.error('❌ Error in /api/profit-by-date-per-stock:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});


app.post('/api/portfolio-evaluation', async (req, res) => {
  const { email, from, to } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Collect all trades in the date range
    let trades = [];
    user.reports.forEach(report => {
      report.tradeEntries.forEach(trade => {
        if (trade.investedDate >= from && trade.investedDate <= to) {
          trades.push(trade);
        }
      });
    });

    if (trades.length === 0) {
      return res.status(404).json({ error: 'No trades found for the given period' });
    }

    // Compute stats for each trade
    const tradesWithStats = trades.map(trade => {
      const invested = parseFloat(trade.investedAmount) || 0;
      const current = parseFloat(trade.currentValue) || 0;
      const profit = current - invested;
      const returnPercent = invested ? (profit / invested) * 100 : 0;

      return { ...trade._doc, profit, returnPercent };
    });

    // Sort gainers and losers
    const sortedByProfitDesc = [...tradesWithStats].sort((a, b) => b.profit - a.profit);
    const sortedByProfitAsc = [...tradesWithStats].sort((a, b) => a.profit - b.profit);
    const sortedByReturnDesc = [...tradesWithStats].sort((a, b) => b.returnPercent - a.returnPercent);

    // Totals
    const totalInvested = tradesWithStats.reduce((acc, t) => acc + parseFloat(t.investedAmount), 0);
    const totalCurrent = tradesWithStats.reduce((acc, t) => acc + parseFloat(t.currentValue), 0);
    const totalProfit = totalCurrent - totalInvested;
    const avgReturnPercent = totalInvested ? (totalProfit / totalInvested) * 100 : 0;

    // Prepare structured JSON response
    const response = {
      from,
      to,
      totalTrades: tradesWithStats.length,
      totalInvested: totalInvested.toFixed(2),
      totalCurrentValue: totalCurrent.toFixed(2),
      profit: totalProfit.toFixed(2),
      averageReturnPercentage: avgReturnPercent.toFixed(2),

      topGainers: sortedByProfitDesc.slice(0, 3).map(t => ({
        stockName: t.stockName,
        profit: t.profit.toFixed(2),
        returnPercent: t.returnPercent.toFixed(2),
      })),

      topLosers: sortedByProfitAsc.slice(0, 3).map(t => ({
        stockName: t.stockName,
        profit: t.profit.toFixed(2),
        returnPercent: t.returnPercent.toFixed(2),
      })),

      mostSuccessfulTrade: sortedByReturnDesc.length > 0 ? {
        stockName: sortedByReturnDesc[0].stockName,
        returnPercent: sortedByReturnDesc[0].returnPercent.toFixed(2),
      } : null,

      allTrades: tradesWithStats, // <-- Add all trades here for frontend display
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




const yahooFinance = require('yahoo-finance2').default;

const stockSymbols = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'SBIN.NS', 'ITC.NS', 'LT.NS', 'AXISBANK.NS', 'BAJFINANCE.NS',
  'WIPRO.NS', 'MARUTI.NS', 'HCLTECH.NS', 'SUNPHARMA.NS', 'ADANIENT.NS'
];

app.get('/api/top-movers', async (req, res) => {
  console.log('👉 /api/top-movers called');
  try {
    const results = await Promise.all(
      stockSymbols.map(async symbol => {
        try {
          const quote = await yahooFinance.quote(symbol);
          const changePercent = (quote.regularMarketChangePercent || 0).toFixed(2);
          return {
            symbol,
            name: quote.shortName,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: parseFloat(changePercent),
          };
        } catch (err) {
          console.warn(`⚠️ Could not fetch ${symbol}:`, err.message);
          return null;
        }
      })
    );

    const validStocks = results.filter(stock => stock !== null && !isNaN(stock.changePercent));

    const topGainers = validStocks
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    const topLosers = validStocks
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    // Log to console
    console.log('📈 Top Gainers:');
    topGainers.forEach(stock => {
      console.log(`🟢 ${stock.name} (${stock.symbol}) - ₹${stock.price} | +${stock.changePercent}%`);
    });

    console.log('\n📉 Top Losers:');
    topLosers.forEach(stock => {
      console.log(`🔴 ${stock.name} (${stock.symbol}) - ₹${stock.price} | ${stock.changePercent}%`);
    });

    res.json({ topGainers, topLosers });
  } catch (err) {
    console.error('❌ Error fetching top movers:', err);
    res.status(500).json({ error: 'Failed to fetch top movers' });
  }
});

const commoditySymbols = [
  'GC=F',  // Gold
  'SI=F',  // Silver
  'CL=F',  // Crude Oil
  'NG=F',  // Natural Gas
  'HG=F',  // Copper
  'ZC=F',  // Corn
  'ZS=F',  // Soybeans
  'KC=F',  // Coffee
  'SB=F',  // Sugar
  'CT=F'   // Cotton
];

// Route to fetch top commodities
app.get('/api/top-commodities', async (req, res) => {
  try {
    const quotes = await Promise.all(
      commoditySymbols.map(symbol => yahooFinance.quote(symbol))
    );

    const sorted = quotes.sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);

    const topCommodities = sorted.map(q => ({
      symbol: q.symbol,
      name: q.shortName,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent
    }));

    res.json({ topCommodities });
  } catch (error) {
    console.error('Error fetching commodity data:', error.message);
    res.status(500).json({ error: 'Failed to fetch commodity data' });
  }
});







// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: '✅ Server running',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔑 Gemini API Key configured: ${!!process.env.GEMINI_API_KEY}`);
});