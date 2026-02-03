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

**Kurirovat** is an intelligent, open-source application designed to help job seekers tailor their resumes and cover letters to specific job descriptions using the power of Google's Gemini AI. 

Stop sending generic applications. Kurirovat analyzes your profile against job requirements to highlight your most relevant skills and experiences, increasing your chances of landing an interview.

## 🚀 Features

-   **🤖 AI-Powered Tailoring**: Automatically adapts your resume summary, skills, and experience bullets to match a specific job description.
-   **📄 PDF Generation**: Export professional, ATS-friendly PDFs of your tailored resumes.
-   **✍️ Cover Letter Generator**: Create personalized cover letters in seconds.
-   **🎨 Multiple Themes**: Choose from various professional resume templates (Modern, Classic, Tech-focused).
-   **📊 Application Tracking**: Keep track of all your job applications in one dashboard.
-   **🔒 Secure & Private**: Your data is stored securely using Supabase.

## 🛠️ Tech Stack

-   **Frontend**: React 19, Vite, TailwindCSS v4, React Router v7
-   **Backend / DB**: Supabase (PostgreSQL, Auth, Edge Functions)
-   **AI**: Google Gemini Pro (via `gemini-3-flash` and `gemini-3-pro`)
-   **PDF Rendering**: `@react-pdf/renderer`

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

-   Node.js (v18 or higher)
-   pnpm (recommended) or npm
-   A [Supabase](https://supabase.com) project
-   A [Google AI Studio](https://aistudio.google.com/) API Key

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
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *Note: The Gemini API Key should be configured securely via Supabase Edge Functions or environment variables as per the latest security practices.*

4.  **Run Locally**
    ```bash
    pnpm dev
    ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
