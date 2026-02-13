'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { uploadAndTrainDocument, deleteDocuments } from '@/lib/ragKnowledgeBase'
import { copyToClipboard } from '@/lib/clipboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  FiBriefcase,
  FiUpload,
  FiFile,
  FiCheck,
  FiCopy,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiStar,
  FiSearch,
  FiBookOpen,
  FiUsers,
  FiMessageSquare,
  FiFileText,
  FiEdit3,
  FiTrash2,
  FiLink,
  FiTarget,
  FiTrendingUp,
  FiAward,
  FiZap,
  FiLayers,
  FiClock,
  FiActivity,
} from 'react-icons/fi'

const RAG_ID = '698f39997049059138db0084'
const MANAGER_AGENT_ID = '698f39ec78357a0e3473e9bd'
const RESUME_AGENT_ID = '698f39d306705e6c39481b96'
const COVER_LETTER_AGENT_ID = '698f39c3bfc1a00f734aa66f'
const COMPANY_RESEARCH_AGENT_ID = '698f39c3952d465a4da7dc1d'
const INTERVIEW_PREP_AGENT_ID = '698f39c40585dc1815076fb9'

interface ResumeOutput {
  optimized_resume?: string
  key_changes?: string[]
  keyword_matches?: string[]
  optimization_score?: string
  additional_suggestions?: string[]
}

interface CoverLetterOutput {
  cover_letter?: string
  key_highlights?: string[]
  tone?: string
  word_count?: string
}

interface CompanyResearchOutput {
  company_overview?: string
  products_services?: string[]
  recent_news?: string[]
  company_culture?: string
  relevant_projects?: string[]
  talking_points?: string[]
  potential_fit?: string
}

interface InterviewPrepOutput {
  behavioral_questions?: string[]
  technical_questions?: string[]
  role_specific_questions?: string[]
  suggested_talking_points?: string[]
  questions_to_ask?: string[]
  interview_tips?: string[]
  preparation_summary?: string
}

interface ManagerResponse {
  status?: string
  job_title?: string
  company_name?: string
  resume_output?: ResumeOutput
  cover_letter_output?: CoverLetterOutput
  company_research_output?: CompanyResearchOutput
  interview_prep_output?: InterviewPrepOutput
}

const SAMPLE_DATA: ManagerResponse = {
  status: 'completed',
  job_title: 'Senior Frontend Engineer',
  company_name: 'TechVision Labs',
  resume_output: {
    optimized_resume: '# Jane Doe\n**Senior Frontend Engineer**\n\nSummary: Results-driven frontend engineer with 7+ years of experience building scalable web applications using React, TypeScript, and Next.js. Led teams of 5-8 engineers delivering high-impact products serving 2M+ users.\n\n## Experience\n\n### Lead Frontend Engineer - CloudScale Inc.\n*Jan 2021 - Present*\n- Architected micro-frontend platform reducing deployment time by 60%\n- Led migration from JavaScript to TypeScript across 15 repositories\n- Implemented design system used by 40+ engineers\n- Improved Core Web Vitals scores by 35% through performance optimization\n\n### Frontend Developer - DataStream Analytics\n*Mar 2018 - Dec 2020*\n- Built real-time data visualization dashboards using D3.js and React\n- Reduced bundle size by 45% through code splitting and lazy loading\n- Mentored 3 junior developers\n\n## Skills\nReact, TypeScript, Next.js, Node.js, GraphQL, AWS, Docker, CI/CD, Agile',
    key_changes: [
      'Added quantifiable metrics to all experience bullet points',
      'Restructured summary to highlight leadership and scale',
      'Added missing TypeScript and Next.js keywords from job description',
      'Reordered skills section to match job requirements priority',
      'Enhanced project descriptions with impact-driven language',
    ],
    keyword_matches: [
      'React',
      'TypeScript',
      'Next.js',
      'Micro-frontend',
      'Design Systems',
      'Performance Optimization',
      'Team Leadership',
      'CI/CD',
      'Agile',
    ],
    optimization_score: '92/100',
    additional_suggestions: [
      'Consider adding a portfolio link showcasing frontend projects',
      'Include any relevant certifications (AWS, Google Cloud)',
      'Add open-source contributions if applicable',
      'Consider a brief section on technical writing or blog posts',
    ],
  },
  cover_letter_output: {
    cover_letter: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Senior Frontend Engineer position at TechVision Labs. With over seven years of experience building scalable web applications and leading engineering teams, I am confident in my ability to make meaningful contributions to your team.\n\nAt CloudScale Inc., I architected a micro-frontend platform that reduced deployment time by 60% and led a TypeScript migration across 15 repositories. These experiences have equipped me with the technical depth and leadership skills that align perfectly with the requirements outlined in your job posting.\n\nWhat excites me most about TechVision Labs is your commitment to pushing the boundaries of user experience through innovative frontend technologies. Your recent work on adaptive interfaces resonates with my passion for creating performant, accessible web applications.\n\nI am particularly drawn to the opportunity to:\n- Lead the development of your next-generation design system\n- Mentor and grow a team of talented frontend engineers\n- Drive performance optimization initiatives across the product suite\n\nI would welcome the opportunity to discuss how my experience aligns with your team\'s goals. Thank you for considering my application.\n\nBest regards,\nJane Doe',
    key_highlights: [
      'Micro-frontend architecture experience directly relevant to role',
      'Proven track record of leading TypeScript migrations',
      'Strong alignment with company mission and recent projects',
      'Quantified impact metrics demonstrating value delivered',
    ],
    tone: 'Professional yet enthusiastic',
    word_count: '198',
  },
  company_research_output: {
    company_overview: 'TechVision Labs is a Series C startup founded in 2019, specializing in AI-powered user experience platforms. The company has raised $85M in funding and serves over 500 enterprise clients globally. Headquartered in San Francisco with remote-friendly policies.',
    products_services: [
      'AdaptiveUI - AI-driven interface personalization engine',
      'DesignFlow - Collaborative design-to-code platform',
      'AnalyticsLens - Real-time UX analytics and heatmapping',
      'AccessibilityFirst - Automated WCAG compliance toolkit',
    ],
    recent_news: [
      'Raised $40M Series C led by Sequoia Capital (Q3 2024)',
      'Launched AdaptiveUI 3.0 with real-time personalization features',
      'Partnership with Adobe for seamless design tool integration',
      'Named in Forbes Cloud 100 Rising Stars list',
      'Expanded engineering team by 40% in the past year',
    ],
    company_culture: 'TechVision Labs emphasizes a culture of innovation, continuous learning, and work-life balance. The company operates with a "build in the open" philosophy, contributing to open-source projects. Regular hackathons, learning stipends of $2,500/year, and flexible remote work policies. Strong emphasis on diversity and inclusion with ERGs and mentorship programs.',
    relevant_projects: [
      'Next-gen design system built with React and Storybook',
      'Performance optimization initiative targeting sub-second load times',
      'Micro-frontend architecture migration for modular deployments',
      'Accessibility-first development framework',
    ],
    talking_points: [
      'Their micro-frontend migration aligns with your CloudScale experience',
      'Mention your design system work - they are building one too',
      'Discuss your TypeScript migration expertise as they value type safety',
      'Reference their open-source philosophy and any contributions you have made',
      'Connect your performance optimization work with their speed initiatives',
    ],
    potential_fit: 'Strong fit based on technical skills alignment (React, TypeScript, micro-frontends), leadership experience matching their team growth phase, and shared values around open-source and accessibility. The role offers growth into an architect-level position.',
  },
  interview_prep_output: {
    behavioral_questions: [
      'Tell me about a time you led a major technical migration. What challenges did you face?',
      'Describe a situation where you had to balance technical debt with feature delivery.',
      'How have you mentored junior engineers? Give a specific example of impact.',
      'Tell me about a time a project failed. What did you learn?',
      'Describe how you handle disagreements about technical decisions with your team.',
    ],
    technical_questions: [
      'How would you architect a micro-frontend system from scratch?',
      'Explain your approach to optimizing Core Web Vitals in a large React application.',
      'How do you handle state management in a complex multi-team frontend?',
      'Describe your testing strategy for a component library used by multiple teams.',
      'How would you implement real-time collaboration features in a web app?',
    ],
    role_specific_questions: [
      'How would you approach building a design system that serves 40+ engineers?',
      'What is your experience with AI-powered UI components?',
      'How do you ensure accessibility compliance across a large codebase?',
      'Describe your approach to frontend performance monitoring and alerting.',
    ],
    suggested_talking_points: [
      'Your 60% deployment time reduction at CloudScale demonstrates impact at scale',
      'The TypeScript migration across 15 repos shows you can drive org-wide changes',
      'Your design system experience is directly applicable to their current initiative',
      'Mention your approach to Core Web Vitals optimization with specific metrics',
    ],
    questions_to_ask: [
      'What does the current frontend architecture look like and what are the biggest pain points?',
      'How does the engineering team collaborate with the design team?',
      'What is the roadmap for the design system initiative?',
      'How do you measure frontend performance and quality?',
      'What does career growth look like for senior engineers here?',
    ],
    interview_tips: [
      'Research AdaptiveUI product thoroughly and prepare specific feedback',
      'Prepare a system design walkthrough for a micro-frontend architecture',
      'Have 2-3 stories ready using the STAR method for behavioral questions',
      'Review their open-source repos on GitHub for technical context',
      'Prepare a brief portfolio of your most impactful frontend projects',
    ],
    preparation_summary: 'Focus on three key areas: (1) Technical depth in React/TypeScript architecture and performance optimization, (2) Leadership experience in managing migrations and mentoring engineers, and (3) Alignment with TechVision Labs\' mission around adaptive, accessible user experiences. Prepare concrete examples with metrics for each area.',
  },
}

const AGENTS_INFO = [
  { id: MANAGER_AGENT_ID, name: 'Job Application Manager', purpose: 'Coordinates all agents and aggregates results' },
  { id: RESUME_AGENT_ID, name: 'Resume Optimizer', purpose: 'Optimizes resume for specific job postings' },
  { id: COVER_LETTER_AGENT_ID, name: 'Cover Letter Writer', purpose: 'Generates tailored cover letters' },
  { id: COMPANY_RESEARCH_AGENT_ID, name: 'Company Researcher', purpose: 'Researches target company details' },
  { id: INTERVIEW_PREP_AGENT_ID, name: 'Interview Prep Coach', purpose: 'Prepares interview questions and tips' },
]

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function ResumeSetupScreen({
  onResumeUploaded,
}: {
  onResumeUploaded: (fileName: string) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setUploadError(null)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadError(null)
    }
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadError(null)

    try {
      const result = await uploadAndTrainDocument(RAG_ID, selectedFile)
      if (result.success) {
        setUploadSuccess(true)
        localStorage.setItem('resumeUploaded', 'true')
        localStorage.setItem('resumeFileName', selectedFile.name)
        setTimeout(() => {
          onResumeUploaded(selectedFile.name)
        }, 1200)
      } else {
        setUploadError(result.error || 'Upload failed. Please try again.')
      }
    } catch {
      setUploadError('An unexpected error occurred during upload.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FiFileText className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif font-semibold text-foreground">Upload Your Resume</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Upload your resume to get started. We will optimize it for each job application you create.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-input hover:border-primary/50 hover:bg-muted/50'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FiUpload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">
              Drag and drop your resume here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse files
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="secondary" className="text-xs"><FiFile className="w-3 h-3 mr-1" />PDF</Badge>
              <Badge variant="secondary" className="text-xs"><FiFile className="w-3 h-3 mr-1" />DOCX</Badge>
              <Badge variant="secondary" className="text-xs"><FiFile className="w-3 h-3 mr-1" />TXT</Badge>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <FiFile className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          {uploadError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <FiAlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{uploadError}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Resume uploaded and processed successfully!</p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || uploadSuccess}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {uploading ? (
              <>
                <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading and Processing...
              </>
            ) : uploadSuccess ? (
              <>
                <FiCheck className="w-4 h-4 mr-2" />
                Resume Ready
              </>
            ) : (
              <>
                <FiUpload className="w-4 h-4 mr-2" />
                Save Resume
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!text) return
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="border-primary/30 hover:bg-primary/5 text-sm"
    >
      {copied ? (
        <>
          <FiCheck className="w-3.5 h-3.5 mr-1.5 text-green-600" />
          {label ? `${label} Copied` : 'Copied'}
        </>
      ) : (
        <>
          <FiCopy className="w-3.5 h-3.5 mr-1.5" />
          {label ? `Copy ${label}` : 'Copy'}
        </>
      )}
    </Button>
  )
}

function DownloadButton({ content, filename, label }: { content: string; filename: string; label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (content) downloadText(content, filename)
      }}
      className="border-primary/30 hover:bg-primary/5 text-sm"
    >
      <FiDownload className="w-3.5 h-3.5 mr-1.5" />
      {label || 'Download'}
    </Button>
  )
}

function ExpandableQuestionList({
  title,
  questions,
  icon,
}: {
  title: string
  questions: string[]
  icon: React.ReactNode
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const safeQuestions = Array.isArray(questions) ? questions : []

  if (safeQuestions.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
        <Badge variant="secondary" className="text-xs ml-auto">{safeQuestions.length}</Badge>
      </div>
      <div className="space-y-2">
        {safeQuestions.map((q, i) => (
          <div
            key={i}
            className="border border-border/50 rounded-lg overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
              className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs font-mono font-semibold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm flex-1">{q}</span>
              {expandedIndex === i ? (
                <FiChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              ) : (
                <FiChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
            </button>
            {expandedIndex === i && (
              <div className="px-3 pb-3 pl-12">
                <p className="text-xs text-muted-foreground italic">
                  Prepare your answer using the STAR method: Situation, Task, Action, Result.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ResumeTab({ data }: { data?: ResumeOutput }) {
  const resumeText = data?.optimized_resume ?? ''
  const keyChanges = Array.isArray(data?.key_changes) ? data.key_changes : []
  const keywordMatches = Array.isArray(data?.keyword_matches) ? data.keyword_matches : []
  const score = data?.optimization_score ?? ''
  const suggestions = Array.isArray(data?.additional_suggestions) ? data.additional_suggestions : []

  return (
    <ScrollArea className="h-[calc(100vh-260px)]">
      <div className="space-y-6 pr-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-serif font-semibold">Optimized Resume</h3>
            {score && (
              <Badge className="bg-primary text-primary-foreground">
                <FiAward className="w-3 h-3 mr-1" />
                Score: {score}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <CopyButton text={resumeText} label="Resume" />
            <DownloadButton content={resumeText} filename="optimized-resume.txt" label="Download" />
          </div>
        </div>

        {resumeText && (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {renderMarkdown(resumeText)}
              </div>
            </CardContent>
          </Card>
        )}

        {keyChanges.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiEdit3 className="w-4 h-4 text-primary" />
                Key Changes Made
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {keyChanges.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {keywordMatches.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiTarget className="w-4 h-4 text-primary" />
                Keyword Matches
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {keywordMatches.map((keyword, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {suggestions.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4 text-primary" />
                Additional Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {suggestions.map((sug, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <FiStar className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}

function CoverLetterTab({ data }: { data?: CoverLetterOutput }) {
  const coverLetter = data?.cover_letter ?? ''
  const highlights = Array.isArray(data?.key_highlights) ? data.key_highlights : []
  const tone = data?.tone ?? ''
  const wordCount = data?.word_count ?? ''

  const [editedLetter, setEditedLetter] = useState(coverLetter)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setEditedLetter(coverLetter)
  }, [coverLetter])

  return (
    <ScrollArea className="h-[calc(100vh-260px)]">
      <div className="space-y-6 pr-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-serif font-semibold">Cover Letter</h3>
            {tone && (
              <Badge variant="secondary" className="text-xs">
                <FiMessageSquare className="w-3 h-3 mr-1" />
                {tone}
              </Badge>
            )}
            {wordCount && (
              <Badge variant="secondary" className="text-xs">
                {wordCount} words
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="border-primary/30 hover:bg-primary/5 text-sm"
            >
              <FiEdit3 className="w-3.5 h-3.5 mr-1.5" />
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
            <CopyButton text={editedLetter} label="Letter" />
            <DownloadButton content={editedLetter} filename="cover-letter.txt" label="Download" />
          </div>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-4">
            {isEditing ? (
              <Textarea
                value={editedLetter}
                onChange={(e) => setEditedLetter(e.target.value)}
                className="min-h-[400px] font-sans text-sm leading-relaxed border-input focus:ring-primary resize-y"
              />
            ) : (
              <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {renderMarkdown(editedLetter)}
              </div>
            )}
          </CardContent>
        </Card>

        {highlights.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiZap className="w-4 h-4 text-primary" />
                Key Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}

function CompanyResearchTab({ data }: { data?: CompanyResearchOutput }) {
  const overview = data?.company_overview ?? ''
  const products = Array.isArray(data?.products_services) ? data.products_services : []
  const news = Array.isArray(data?.recent_news) ? data.recent_news : []
  const culture = data?.company_culture ?? ''
  const projects = Array.isArray(data?.relevant_projects) ? data.relevant_projects : []
  const talkingPoints = Array.isArray(data?.talking_points) ? data.talking_points : []
  const fit = data?.potential_fit ?? ''

  const allText = [overview, products.join('\n'), news.join('\n'), culture, projects.join('\n'), talkingPoints.join('\n'), fit].join('\n\n')

  return (
    <ScrollArea className="h-[calc(100vh-260px)]">
      <div className="space-y-6 pr-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif font-semibold">Company Research</h3>
          <div className="flex gap-2">
            <CopyButton text={allText} label="Research" />
            <DownloadButton content={allText} filename="company-research.txt" label="Download" />
          </div>
        </div>

        {overview && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiSearch className="w-4 h-4 text-primary" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm leading-relaxed">{renderMarkdown(overview)}</div>
            </CardContent>
          </Card>
        )}

        {products.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiLayers className="w-4 h-4 text-primary" />
                Products & Services
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {products.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <FiZap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {news.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiActivity className="w-4 h-4 text-primary" />
                Recent News
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {news.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <FiTrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {culture && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-primary" />
                Company Culture
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm leading-relaxed">{renderMarkdown(culture)}</div>
            </CardContent>
          </Card>
        )}

        {projects.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiBriefcase className="w-4 h-4 text-primary" />
                Relevant Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {projects.map((proj, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border/30 text-sm">
                    <FiBookOpen className="w-3.5 h-3.5 text-primary mb-1" />
                    {proj}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {talkingPoints.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiMessageSquare className="w-4 h-4 text-primary" />
                Talking Points
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {talkingPoints.map((tp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <FiTarget className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{tp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {fit && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiStar className="w-4 h-4 text-primary" />
                Potential Fit Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm leading-relaxed">{renderMarkdown(fit)}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}

function InterviewPrepTab({ data }: { data?: InterviewPrepOutput }) {
  const behavioral = Array.isArray(data?.behavioral_questions) ? data.behavioral_questions : []
  const technical = Array.isArray(data?.technical_questions) ? data.technical_questions : []
  const roleSpecific = Array.isArray(data?.role_specific_questions) ? data.role_specific_questions : []
  const talkingPoints = Array.isArray(data?.suggested_talking_points) ? data.suggested_talking_points : []
  const questionsToAsk = Array.isArray(data?.questions_to_ask) ? data.questions_to_ask : []
  const tips = Array.isArray(data?.interview_tips) ? data.interview_tips : []
  const summary = data?.preparation_summary ?? ''

  const allText = [
    'BEHAVIORAL QUESTIONS:\n' + behavioral.join('\n'),
    'TECHNICAL QUESTIONS:\n' + technical.join('\n'),
    'ROLE-SPECIFIC QUESTIONS:\n' + roleSpecific.join('\n'),
    'TALKING POINTS:\n' + talkingPoints.join('\n'),
    'QUESTIONS TO ASK:\n' + questionsToAsk.join('\n'),
    'TIPS:\n' + tips.join('\n'),
    'SUMMARY:\n' + summary,
  ].join('\n\n')

  return (
    <ScrollArea className="h-[calc(100vh-260px)]">
      <div className="space-y-6 pr-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif font-semibold">Interview Preparation</h3>
          <div className="flex gap-2">
            <CopyButton text={allText} label="Prep" />
            <DownloadButton content={allText} filename="interview-prep.txt" label="Download" />
          </div>
        </div>

        {summary && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiBookOpen className="w-4 h-4 text-primary" />
                Preparation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm leading-relaxed">{renderMarkdown(summary)}</div>
            </CardContent>
          </Card>
        )}

        <ExpandableQuestionList
          title="Behavioral Questions"
          questions={behavioral}
          icon={<FiUsers className="w-4 h-4 text-primary" />}
        />

        <ExpandableQuestionList
          title="Technical Questions"
          questions={technical}
          icon={<FiLayers className="w-4 h-4 text-primary" />}
        />

        <ExpandableQuestionList
          title="Role-Specific Questions"
          questions={roleSpecific}
          icon={<FiBriefcase className="w-4 h-4 text-primary" />}
        />

        {talkingPoints.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiMessageSquare className="w-4 h-4 text-primary" />
                Suggested Talking Points
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {talkingPoints.map((tp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <FiTarget className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{tp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {questionsToAsk.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiSearch className="w-4 h-4 text-primary" />
                Questions to Ask the Interviewer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {questionsToAsk.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-xs font-mono font-semibold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {tips.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiStar className="w-4 h-4 text-primary" />
                Interview Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <FiActivity className="w-3.5 h-3.5" />
        <span>Agent Status</span>
        {isOpen ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
      </button>
      {isOpen && (
        <Card className="mt-2 border-border/50">
          <CardContent className="p-3">
            <div className="space-y-1.5">
              {AGENTS_INFO.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="font-medium truncate">{agent.name}</span>
                  <span className="text-muted-foreground truncate hidden sm:inline">- {agent.purpose}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function Page() {
  const [resumeUploaded, setResumeUploaded] = useState(false)
  const [resumeFileName, setResumeFileName] = useState('')
  const [showSampleData, setShowSampleData] = useState(false)
  const [jobUrl, setJobUrl] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [responseData, setResponseData] = useState<ManagerResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('resume')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [showChangeResume, setShowChangeResume] = useState(false)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const uploaded = localStorage.getItem('resumeUploaded')
    const fileName = localStorage.getItem('resumeFileName')
    if (uploaded === 'true' && fileName) {
      setResumeUploaded(true)
      setResumeFileName(fileName)
    }
  }, [])

  const displayData = showSampleData ? SAMPLE_DATA : responseData

  const handleResumeUploaded = (fileName: string) => {
    setResumeUploaded(true)
    setResumeFileName(fileName)
  }

  const handleRemoveResume = async () => {
    if (resumeFileName) {
      await deleteDocuments(RAG_ID, [resumeFileName])
    }
    localStorage.removeItem('resumeUploaded')
    localStorage.removeItem('resumeFileName')
    setResumeUploaded(false)
    setResumeFileName('')
    setShowChangeResume(false)
    setResponseData(null)
  }

  const handleGenerate = async () => {
    if (!jobDescription.trim() && !jobUrl.trim()) {
      setErrorMessage('Please provide a job URL or paste a job description.')
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)
    setResponseData(null)
    setProgressValue(0)
    setActiveAgentId(MANAGER_AGENT_ID)

    progressIntervalRef.current = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 8
      })
    }, 800)

    const message = [
      jobTitle ? `Job Title: ${jobTitle}` : '',
      jobUrl ? `Job URL: ${jobUrl}` : '',
      jobDescription ? `Job Description: ${jobDescription}` : '',
      '',
      'Please analyze this job posting and generate all application materials including an optimized resume, cover letter, company research, and interview preparation.',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const result = await callAIAgent(message, MANAGER_AGENT_ID)

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      setProgressValue(100)

      if (result?.success) {
        const data = result?.response?.result as ManagerResponse | undefined
        if (data) {
          setResponseData(data)
          setActiveTab('resume')
        } else {
          setErrorMessage('Received an empty response from the agent. Please try again.')
        }
      } else {
        setErrorMessage(result?.error || result?.response?.message || 'Generation failed. Please try again.')
      }
    } catch {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsGenerating(false)
      setActiveAgentId(null)
      setTimeout(() => setProgressValue(0), 1500)
    }
  }

  const handleDownloadAll = () => {
    if (!displayData) return
    const resumeText = displayData?.resume_output?.optimized_resume ?? ''
    const coverLetter = displayData?.cover_letter_output?.cover_letter ?? ''

    const companyResearch = [
      'COMPANY OVERVIEW:',
      displayData?.company_research_output?.company_overview ?? '',
      '\nPRODUCTS & SERVICES:',
      ...(Array.isArray(displayData?.company_research_output?.products_services) ? displayData.company_research_output.products_services : []),
      '\nRECENT NEWS:',
      ...(Array.isArray(displayData?.company_research_output?.recent_news) ? displayData.company_research_output.recent_news : []),
      '\nCOMPANY CULTURE:',
      displayData?.company_research_output?.company_culture ?? '',
      '\nRELEVANT PROJECTS:',
      ...(Array.isArray(displayData?.company_research_output?.relevant_projects) ? displayData.company_research_output.relevant_projects : []),
      '\nTALKING POINTS:',
      ...(Array.isArray(displayData?.company_research_output?.talking_points) ? displayData.company_research_output.talking_points : []),
      '\nPOTENTIAL FIT:',
      displayData?.company_research_output?.potential_fit ?? '',
    ].join('\n')

    const interviewPrep = [
      'BEHAVIORAL QUESTIONS:',
      ...(Array.isArray(displayData?.interview_prep_output?.behavioral_questions) ? displayData.interview_prep_output.behavioral_questions.map((q, i) => `${i + 1}. ${q}`) : []),
      '\nTECHNICAL QUESTIONS:',
      ...(Array.isArray(displayData?.interview_prep_output?.technical_questions) ? displayData.interview_prep_output.technical_questions.map((q, i) => `${i + 1}. ${q}`) : []),
      '\nROLE-SPECIFIC QUESTIONS:',
      ...(Array.isArray(displayData?.interview_prep_output?.role_specific_questions) ? displayData.interview_prep_output.role_specific_questions.map((q, i) => `${i + 1}. ${q}`) : []),
      '\nSUGGESTED TALKING POINTS:',
      ...(Array.isArray(displayData?.interview_prep_output?.suggested_talking_points) ? displayData.interview_prep_output.suggested_talking_points : []),
      '\nQUESTIONS TO ASK:',
      ...(Array.isArray(displayData?.interview_prep_output?.questions_to_ask) ? displayData.interview_prep_output.questions_to_ask : []),
      '\nINTERVIEW TIPS:',
      ...(Array.isArray(displayData?.interview_prep_output?.interview_tips) ? displayData.interview_prep_output.interview_tips : []),
      '\nPREPARATION SUMMARY:',
      displayData?.interview_prep_output?.preparation_summary ?? '',
    ].join('\n')

    const fullContent = [
      `JOB APPLICATION MATERIALS - ${displayData?.job_title ?? 'Position'} at ${displayData?.company_name ?? 'Company'}`,
      '='.repeat(60),
      '\n\n=== OPTIMIZED RESUME ===\n',
      resumeText,
      '\n\n=== COVER LETTER ===\n',
      coverLetter,
      '\n\n=== COMPANY RESEARCH ===\n',
      companyResearch,
      '\n\n=== INTERVIEW PREPARATION ===\n',
      interviewPrep,
    ].join('\n')

    const filename = `job-application-${(displayData?.company_name ?? 'company').toLowerCase().replace(/\s+/g, '-')}.txt`
    downloadText(fullContent, filename)
  }

  if (!resumeUploaded && !showChangeResume) {
    return <ResumeSetupScreen onResumeUploaded={handleResumeUploaded} />
  }

  if (showChangeResume) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiBriefcase className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-serif font-semibold text-foreground">JobAssist Pro</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowChangeResume(false)} className="border-primary/30">
              <FiX className="w-4 h-4 mr-1.5" /> Cancel
            </Button>
          </div>
        </header>
        <div className="max-w-lg mx-auto mt-12 px-4">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-serif">Change Resume</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Current: <span className="font-medium text-foreground">{resumeFileName}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleRemoveResume}
              >
                <FiTrash2 className="w-4 h-4 mr-2" />
                Remove Current Resume and Upload New
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                This will delete your current resume from the knowledge base and allow you to upload a new one.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiBriefcase className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-serif font-semibold text-foreground">JobAssist Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
              <Switch
                id="sample-toggle"
                checked={showSampleData}
                onCheckedChange={setShowSampleData}
              />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                <FiCheck className="w-3 h-3 mr-1" />
                Resume Ready
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangeResume(true)}
                className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              >
                <FiRefreshCw className="w-3 h-3 mr-1" />
                Change
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif font-semibold flex items-center gap-2">
                    <FiFileText className="w-4 h-4 text-primary" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="job-url" className="text-xs font-medium">Job URL</Label>
                    <div className="relative">
                      <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="job-url"
                        placeholder="Paste job link here..."
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        className="pl-9 border-input focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="job-desc" className="text-xs font-medium">Job Description</Label>
                    <Textarea
                      id="job-desc"
                      placeholder="Or paste the full job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[160px] border-input focus:ring-primary text-sm resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="job-title" className="text-xs font-medium">Job Title <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      id="job-title"
                      placeholder="e.g. Senior Frontend Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="border-input focus:ring-primary text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <FiFile className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Using resume: {resumeFileName}</span>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    {isGenerating ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Materials...
                      </>
                    ) : (
                      <>
                        <FiZap className="w-4 h-4 mr-2" />
                        Generate All Materials
                      </>
                    )}
                  </Button>

                  {isGenerating && (
                    <div className="space-y-2">
                      <Progress value={progressValue} className="h-1.5" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FiClock className="w-3 h-3 animate-pulse" />
                        <span>
                          {progressValue < 25
                            ? 'Analyzing job description...'
                            : progressValue < 50
                            ? 'Optimizing resume...'
                            : progressValue < 75
                            ? 'Generating cover letter & research...'
                            : 'Preparing interview materials...'}
                        </span>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <FiAlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{errorMessage}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <AgentStatusPanel activeAgentId={activeAgentId} />
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8">
            {!displayData && !isGenerating && (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <FiBriefcase className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                    Ready to Generate Application Materials
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Paste a job URL or description on the left and click "Generate All Materials" to create an optimized resume, cover letter, company research, and interview prep guide.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>Or toggle</span>
                    <Badge variant="secondary" className="text-xs">Sample Data</Badge>
                    <span>to preview the output format</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {isGenerating && !displayData && (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <FiRefreshCw className="w-10 h-10 text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                    Generating Your Materials
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                    Our AI agents are working together to create your personalized application package. This may take a moment.
                  </p>
                  <div className="max-w-xs mx-auto space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${progressValue > 10 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {progressValue > 10 ? <FiCheck className="w-3 h-3" /> : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                      </div>
                      <span className={progressValue > 10 ? 'text-foreground' : 'text-muted-foreground'}>Analyzing job posting</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${progressValue > 30 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {progressValue > 30 ? <FiCheck className="w-3 h-3" /> : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                      </div>
                      <span className={progressValue > 30 ? 'text-foreground' : 'text-muted-foreground'}>Optimizing resume</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${progressValue > 55 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {progressValue > 55 ? <FiCheck className="w-3 h-3" /> : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                      </div>
                      <span className={progressValue > 55 ? 'text-foreground' : 'text-muted-foreground'}>Writing cover letter</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${progressValue > 70 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {progressValue > 70 ? <FiCheck className="w-3 h-3" /> : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                      </div>
                      <span className={progressValue > 70 ? 'text-foreground' : 'text-muted-foreground'}>Researching company</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${progressValue > 85 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {progressValue > 85 ? <FiCheck className="w-3 h-3" /> : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                      </div>
                      <span className={progressValue > 85 ? 'text-foreground' : 'text-muted-foreground'}>Preparing interview guide</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {displayData && (
              <div className="space-y-4">
                {/* Results Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-serif font-semibold">
                      {displayData?.job_title ?? 'Application Materials'}
                    </h2>
                    {displayData?.company_name && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        {displayData.company_name}
                      </Badge>
                    )}
                    {displayData?.status && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {displayData.status}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    className="border-primary/30 hover:bg-primary/5"
                  >
                    <FiDownload className="w-3.5 h-3.5 mr-1.5" />
                    Download All
                  </Button>
                </div>

                {/* Tabbed Results */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-muted/50 border border-border/50 w-full justify-start overflow-x-auto">
                    <TabsTrigger value="resume" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FiFileText className="w-3.5 h-3.5 mr-1.5" />
                      Resume
                    </TabsTrigger>
                    <TabsTrigger value="cover-letter" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FiEdit3 className="w-3.5 h-3.5 mr-1.5" />
                      Cover Letter
                    </TabsTrigger>
                    <TabsTrigger value="research" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FiSearch className="w-3.5 h-3.5 mr-1.5" />
                      Company Research
                    </TabsTrigger>
                    <TabsTrigger value="interview" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FiUsers className="w-3.5 h-3.5 mr-1.5" />
                      Interview Prep
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="resume" className="mt-4">
                    <ResumeTab data={displayData?.resume_output} />
                  </TabsContent>
                  <TabsContent value="cover-letter" className="mt-4">
                    <CoverLetterTab data={displayData?.cover_letter_output} />
                  </TabsContent>
                  <TabsContent value="research" className="mt-4">
                    <CompanyResearchTab data={displayData?.company_research_output} />
                  </TabsContent>
                  <TabsContent value="interview" className="mt-4">
                    <InterviewPrepTab data={displayData?.interview_prep_output} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
