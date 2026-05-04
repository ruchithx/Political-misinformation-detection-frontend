import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Exact path to the test dataset in the ML repo
    const csvPath = 'C:\\Users\\User\\OneDrive\\Documents\\GitHub\\political-misinformation-detection\\data\\text\\splits\\test.csv';

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'Test dataset not found' }, { status: 404 });
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Skip header and parse lines
    // CSV format: id,label,source,platform,url,split,text_raw,...
    const header = lines[0].split(',');
    const textRawIdx = header.indexOf('text_raw');
    const labelIdx = header.indexOf('label');

    const samples = lines.slice(1, 101).map((line, index) => {
      // Simple CSV split (not handling commas in quotes properly but enough for quick test samples)
      // For a more robust solution, use a CSV parser library, but we can try a simple regex for now
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      return {
        id: index,
        text: parts[textRawIdx]?.replace(/^"|"$/g, '') || '',
        actualLabel: parts[labelIdx] === '1' ? 'FAKE' : 'REAL' // Adjusted based on common patterns, will verify
      };
    }).filter(s => s.text.length > 10);

    // Return a random selection of 10 samples
    const shuffled = samples.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    return NextResponse.json(selected);
  } catch (error: any) {
    console.error('Error reading test samples:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
