# TruthLens: Political Misinformation Detection Dashboard

TruthLens is a frontend dashboard application designed for researching and detecting political misinformation across text, images, and social metadata. It provides an intuitive, interactive interface for interacting with underlying multimodal machine learning pipelines (like BERT, ResNet-50, and Graph Attention Networks).

## 🚀 Key Features

- **Multimodal Analysis**: Submit text, social media context, and image content to evaluate the credibility of political statements.
- **Intuitive Visualizations**: View detailed breakdowns of model components, including:
  - **Verdict & Confidence**: Clear labeling (e.g. Credible vs Misinformation) with confidence score meters.
  - **Modality Scoring**: Individual component scores for Text, Image, Social Context, and a combined early/late Fusion score.
  - **Attention Analysis**: Heatmapping for important word tokens that most heavily influenced the NLP model's decision.
- **Interactive Ablation Studies**: An integrated workspace for studying how the model behaves when different modalities are isolated, bypassed, or removed. Includes radar charts, line charts, and metric tables.
- **History Tracking**: Stores and tracks past inferences locally for quick reference and comparison.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **State Management & Fetching**: React, `@tanstack/react-query`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: Custom UI built on [Radix UI](https://www.radix-ui.com/) and [Shadcn UI](https://ui.shadcn.com/)
- **Animations & Data Vis**: `framer-motion`, `recharts`
- **Language**: TypeScript

## 📦 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v20+ recommended) and `npm` installed.

### Installation

1. Clone the repository and navigate into the frontend directory.
2. Install the dependencies:

```bash
npm install
# or
yarn install
```

### Environment Variables

Create a `.env.local` file in the root of your project and configure your backend API endpoint. If running the Python FastAPI backend locally on port 8000, use:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

*Note: For the application to fully work and process analyses, you need to be running the matching TruthLens misinformation backend API locally.*

### Running the Development Server

Start the Next.js development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `app/`: Next.js App Router pages and API proxy routes (Dashboard, Analysis, History, Ablation workflows).
- `components/`: Modular React components grouped by functional area:
  - `ablation/`: Charts, radar graphs, and tables for the ablation study workspace.
  - `analysis/`: Result visualizers, gauges, heatmaps, and multimodal input forms.
  - `history/`: Lists and filtering for historical runs.
  - `layout/`: Shell wrapping, topbars, and sidebar navigation.
- `hooks/`: Custom React hooks, primarily wrapping React Query (`useAnalysis`, `useAblation`, `useHistory`).
- `providers/`: React Context providers for global configurations (`QueryProvider`, user state).
- `lib/`: Utilities, theme constants, fetch formatters, and global TypeScript definitions.

## 📄 Disclaimer

TruthLens is intended to be used as an educational and academic research tool for studying misinformation detection algorithms. Predictions and model outputs are probabilistic approximations, not definitive facts.
