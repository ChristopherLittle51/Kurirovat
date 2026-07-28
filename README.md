<div align="center">
  
  # Kurirovat
  
  **Curating your career path with AI.**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
</div>

---

**Kurirovat** is an evidence-first resume and application coach. It analyzes hiring requirements, reuses verified STAR evidence, asks only for material missing proof, and produces a resume and cover letter from one shared content strategy.

Stop sending generic applications. Kurirovat analyzes your profile against job requirements to highlight your most relevant skills and experiences, increasing your chances of landing an interview.

## 🚀 Features

-   **🤖 Evidence-first tailoring**: Maps prioritized job requirements to owner-only candidate evidence before drafting.
-   **💬 Resumable STAR interview**: Pauses for one high-value question at a time and permanently saves useful answers.
-   **📄 Reviewed PDF generation**: Validates the actual PDF text and page count, warns on layout problems, and enforces a two-page planning target.
-   **✍️ Cover Letter Generator**: Create personalized cover letters in seconds.
-   **🎨 Multiple Themes**: Choose from various professional resume templates (Modern, Classic, Tech-focused).
-   **📊 Outcome timelines**: Tracks replies, screening, interviews, rejection, offers, withdrawal, and no response without inventing historical dates.
-   **🎯 Ideal Role Benchmark**: Generate a theoretical, evidence-backed job title and description that fully matches your saved profile.
-   **🔒 Secure & Private**: Your data is stored securely using Supabase.

## 🛠️ Tech Stack

-   **Frontend**: React 19, Vite, TailwindCSS v4, React Router v7
-   **Backend / DB**: Supabase (PostgreSQL, Auth, Edge Functions)
-   **AI**: OpenAI Responses API with strict Structured Outputs
-   **Model routing**: `gpt-5.6-terra` for extraction/normalization; `gpt-5.6-sol` for strategy, drafting, repair, and review
-   **PDF Rendering / Inspection**: `@react-pdf/renderer` and PDF.js

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

-   Node.js (v18 or higher)
-   pnpm (recommended) or npm
-   A [Supabase](https://supabase.com) project
-   An OpenAI API key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ChristopherLittle51/kurirovat.git
    cd kurirovat
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    # or
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory (copy from `.env.example` if available) and add your credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
    ```

    Configure the model credential only as an Edge Function secret:

    ```bash
    supabase secrets set OPENAI_API_KEY=your_openai_api_key
    ```

    Do not expose `OPENAI_API_KEY` through Vite or browser environment variables.
    Optional `OPENAI_TERRA_INPUT_COST_PER_MILLION`, `OPENAI_TERRA_OUTPUT_COST_PER_MILLION`,
    `OPENAI_SOL_INPUT_COST_PER_MILLION`, and `OPENAI_SOL_OUTPUT_COST_PER_MILLION`
    secrets enable per-run cost estimates without hard-coding prices.

4.  **Apply the database migration and deploy the Edge Function**

    ```bash
    supabase db push
    supabase functions deploy gemini-api
    ```

    The deployed function name remains `gemini-api` temporarily for endpoint compatibility; its runtime is OpenAI-only. Confirm `OPENAI_API_KEY` exists, exercise parsing, generation, imports, condensing, and PDF review, and then remove the old `GOOGLE_GENAI_API_KEY` deployment secret.

5.  **Run Locally**
    ```bash
    pnpm dev
    ```

### Verification

```bash
pnpm test
pnpm build
pnpm eval:tailoring-v2
```

See [Tailoring v2 architecture](docs/tailoring-v2-architecture.md), [evaluation and launch gates](docs/tailoring-v2-evaluation.md), and [application outcome timelines](docs/application-outcome-timeline.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
