import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const csvPath = 'C:\\Users\\User\\OneDrive\\Documents\\GitHub\\political-misinformation-detection\\data\\mediaContext\\processed\\media_context_dataset_enriched.csv';

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'Media context dataset not found' }, { status: 404 });
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Parse header
    const header = lines[0].split(',');
    
    // We want to extract some interesting fields for display
    const labelIdx = header.indexOf('label');
    const domainIdx = header.indexOf('domain_credibility_score');
    const richnessIdx = header.indexOf('media_richness_score');
    const completenessIdx = header.indexOf('metadata_completeness');
    const platformIdx = header.indexOf('platform');

    const samples = lines.slice(1, 101).map((line, index) => {
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      // Construct a "social_data" object like the backend expects
      const socialData: Record<string, any> = {};
      header.forEach((col, i) => {
        const val = parts[i]?.replace(/^"|"$/g, '');
        // Convert to number if possible
        if (!isNaN(Number(val)) && val !== '') {
          socialData[col] = Number(val);
        } else {
          socialData[col] = val;
        }
      });

      return {
        id: index,
        text: `Source evaluation for ${parts[platformIdx] || 'web'} content`,
        actualLabel: parts[labelIdx] === '1' || parts[labelIdx]?.toLowerCase() === 'fake' ? 'FAKE' : 'REAL',
        socialData: socialData,
        displayMeta: {
          domainScore: parts[domainIdx],
          mediaRichness: parts[richnessIdx],
          completeness: parts[completenessIdx]
        }
      };
    }).filter(s => s.socialData.label !== undefined);

    const shuffled = samples.sort(() => 0.5 - Math.random());
    return NextResponse.json(shuffled.slice(0, 10));
  } catch (error: any) {
    console.error('Error reading media samples:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
