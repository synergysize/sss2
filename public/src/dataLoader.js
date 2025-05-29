/**
 * dataLoader.js - Load and process wallet data from CSV files
 * 
 * This module processes the wallet data from fartcoin.csv and goattoken.csv,
 * structures them into arrays, and identifies shared wallets.
 */

// Simple CSV parser function that handles the structure of our files
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const entry = {};
    
    headers.forEach((header, index) => {
      if (header === 'Account') {
        entry.address = values[index];
      } else if (header === 'Quantity' || header === 'Quantity(GOAT)') {
        entry.amount = parseFloat(values[index]);
      }
    });
    
    return entry;
  });
};

// Embedded CSV data
const FARTCOIN_DATA = `Account,Quantity(GOAT),Tokens Held,SOL Balance,Wallet Age
u6PJ8DtQuPFnfmwHbGFULQ4u4EgjDiyYKjVEsynXq2w,53353226.72,,,
9SLPTL41SPsYkgdsMzdfJsxymEANKr5bYoBsQzJyKpKS,19700515.36,,,
F7RkX6Y1qTfBqoX5oHoZEgrG1Dpy55UZ3GfWwPbM58nQ,18358622.60,,,
A77HErqtfN1hLLpvZ9pCtu66FEtM8BveoaKbbMoZ4RiR,17700127.59,,,
44P5Ct5JkPz76Rs2K6juC65zXMpFRDrHatxcASJ4Dyra,16151152.36,,,
9cNE6KBg2Xmf34FPMMvzDF8yUHMrgLRzBV3vD7b1JnUS,12645354.91,,,
38ESLHdJkqNvMbJmbgsHJGXjJPpsL4TkvSUgXegYgvpr,10001047.32,,,
5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1,9042762.02,,,
AcFmVa1HJTKkz6qn4sfLAFvjKqd914KgdaNHGEszMR5Q,8891026.60,,,
GxhQ5LTFc4dTxAXt7aQ4uSKvr8ev9T2QXE9zWKA3pjFP,8591047.43,,,
79sJvLQ3QrL88Uc9jgV3iTT5Ft19xtMbjmAkhgoKh38W,7932329.62,,,
FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5,7763719.78,,,
7QAFvj11sS5kgNh7otR3EGEZbGRHR3nMwNz31rTcDm8P,7523424.67,,,
Ait7nuyWJSxHF7c1WX2CQ7AHFa2nPFYYg84xL5nPhYtn,7025023.12,,,
DBmae92YTQKLsNzXcPscxiwPqMcz9stQr2prB5ZCAHPd,6728342.10,,,
ASTyfSima4LLAdDgoFGkgqoKowG1LZFDr9fAQrg7iaJZ,6655043.23,,,
HVh6wHNBAsG3pq1Bj5oCzRjoWKVogEDHwUHkRz3ekFgt,6251889.47,,,
8icKqfmu95pCmfQLc2cLkmhB7LqN8tRaaE4cvKnGpwpq,6002400.00,,,
DHeiaWt2MzA5BgBU6FQe6V3K8akJMcDbXYxrqPV19F9U,6000100.00,,,`;

const GOATTOKEN_DATA = `Account,Quantity
8Mm46CsqxiyAputDUp2cXHg41HE3BfynTeMBDwzrMZQH,112378114.33
hTvwKr1RvQdPS5xiWfXM2UZYuF55Ei8zzsuB7e58feu,109758331.88
AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2,67456670.68
CBEADkb8TZAXHjVE3zwad4L995GZE7rJcacJ7asebkVG,52117385.50
u6PJ8DtQuPFnfmwHbGFULQ4u4EgjDiyYKjVEsynXq2w,41100416.44
JBQ1suc4GJBbVYP6y2poGjoDCFrfjtGSEJRt4deasyNe,32829674.18
A77HErqtfN1hLLpvZ9pCtu66FEtM8BveoaKbbMoZ4RiR,32479739.27
4vmjUC6AtFK4JyF9CrcBM8Wtq9fFvUSa31pLWJumGMZ,29012410.64
81BgcfZuZf9bESLvw3zDkh7cZmMtDwTPgkCvYu7zx26o,27626054.69
7XmrmvNNGc3LHqq3HqGHnCdgoAQv4yx7kHwYqtiMPzgD,24226306.00
8DBwT4zFqHmK5KU4kMj1zceQANHwf76NRuhevB7ZSoEc,22284354.03
5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1,18023656.63
5PAhQiYdLBd6SVdjzBQDxUAEFyDdF5ExNPQfcscnPRj5,16718869.33
417ccNwQnQykVbFUDKd3sh6xHKGSRTaCTWr6sdR9ZuCa,10704068.07
6FEVkH17P9y8Q9aCkDdPcMDjvj7SVxrTETaYEm8f51Jy,8875472.76
2tU4k62hFNMwwxrynmudXGv3csNQuxLtDBUsxAMt9SdL,8698591.41
Ezhr48hfsyUg9zoAq7CH5opi7NbSM34RjrVFf4n8cVpo,8539942.52
DBmae92YTQKLsNzXcPscxiwPqMcz9stQr2prB5ZCAHPd,8189534.80
HVh6wHNBAsG3pq1Bj5oCzRjoWKVogEDHwUHkRz3ekFgt,7987933.45`;

// Function to load a CSV file using XMLHttpRequest (synchronously)
const loadCSVFile = (filePath) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', filePath, false); // false for synchronous
    xhr.send();
    
    if (xhr.status === 200) {
      return xhr.responseText;
    } else {
      console.error(`Failed to load ${filePath} - status: ${xhr.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
};

// Load and process the CSV data
const loadWalletData = () => {
  try {
    // Try to load the full CSV files from the public directory
    let fartcoinCSV = loadCSVFile('./fartcoin.csv');
    let goatTokenCSV = loadCSVFile('./goattoken.csv');
    
    // Fall back to embedded data if loading files failed
    if (!fartcoinCSV || !goatTokenCSV) {
      console.warn('Failed to load full CSV files. Using embedded sample data instead.');
      fartcoinCSV = FARTCOIN_DATA;
      goatTokenCSV = GOATTOKEN_DATA;
    } else {
      console.log('Successfully loaded full dataset of 💨 and 🐐 from CSV files (1000+ wallets each)');
    }
    
    // Parse the CSV data
    let fartcoinData = parseCSV(fartcoinCSV);
    let goatTokenData = parseCSV(goatTokenCSV);
    
    // Filter out any entries without an address or amount
    fartcoinData = fartcoinData.filter(entry => entry.address && !isNaN(entry.amount));
    goatTokenData = goatTokenData.filter(entry => entry.address && !isNaN(entry.amount));
    
    // Normalize addresses (convert to lowercase)
    fartcoinData.forEach(entry => {
      entry.address = entry.address.toLowerCase();
    });
    
    goatTokenData.forEach(entry => {
      entry.address = entry.address.toLowerCase();
    });
    
    // Sort by amount (largest to smallest)
    fartcoinData.sort((a, b) => b.amount - a.amount);
    goatTokenData.sort((a, b) => b.amount - a.amount);
    
    // Find shared wallets
    const fartcoinAddresses = new Map();
    fartcoinData.forEach(entry => {
      fartcoinAddresses.set(entry.address, entry.amount);
    });
    
    const sharedHolders = [];
    const seenAddresses = new Set();
    
    goatTokenData.forEach(goatEntry => {
      if (fartcoinAddresses.has(goatEntry.address)) {
        sharedHolders.push({
          address: goatEntry.address,
          fartAmount: fartcoinAddresses.get(goatEntry.address),
          goatAmount: goatEntry.amount
        });
        seenAddresses.add(goatEntry.address);
      }
    });
    
    // Sort shared holders by combined amount
    sharedHolders.sort((a, b) => {
      const totalA = a.fartAmount + a.goatAmount;
      const totalB = b.fartAmount + b.goatAmount;
      return totalB - totalA;
    });
    
    console.log(`Loaded ${fartcoinData.length} 💨 holders`);
    console.log(`Loaded ${goatTokenData.length} 🐐 holders`);
    console.log(`Found ${sharedHolders.length} shared wallet addresses`);
    
    return {
      fartcoinHolders: fartcoinData,
      goatTokenHolders: goatTokenData,
      sharedHolders: sharedHolders
    };
  } catch (error) {
    console.error('Error loading wallet data:', error);
    return {
      fartcoinHolders: [],
      goatTokenHolders: [],
      sharedHolders: []
    };
  }
};

// Export the data loading function and placeholder arrays
export let fartcoinHolders = [];
export let goatTokenHolders = [];
export let sharedHolders = [];

// Initialize the data
export const initializeData = () => {
  const data = loadWalletData();
  fartcoinHolders = data.fartcoinHolders;
  goatTokenHolders = data.goatTokenHolders;
  sharedHolders = data.sharedHolders;
  return data;
};

// Default export for convenience
export default {
  initializeData,
  fartcoinHolders,
  goatTokenHolders,
  sharedHolders
};