
'use client';

import { useState, useCallback, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/context/quiz-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText } from 'lucide-react';
import { ThemeToggleButton } from '@/components/layout/theme-toggle-button';

const QLogo = ({ size = 64 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary"
    data-ai-hint="letter Q logo"
  >
    <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="7"/>
    <line x1="33" y1="35" x2="50" y2="52" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
  </svg>
);

const ACCEPTED_FILE_TYPES = ['.txt', '.md', '.html', '.rtf', '.odt', '.doc', '.docx', '.pdf'];
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Simple client-side parsers (placeholders for complex formats)
const readFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.html')) {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    } else if (file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.rtf') || file.name.endsWith('.odt')) {
      console.warn(`Client-side parsing for ${file.name} is complex. Using file name as placeholder content.`);
      resolve(`Content from file: ${file.name}. Full parsing for this file type would require a dedicated library or server-side processing.`);
    } else {
      reject(new Error(`Unsupported file type: ${file.type}. Please upload one of the supported types.`));
    }
  });
};

export default function HomePage() {
  const router = useRouter();
  const { setDocumentContent, resetQuiz, setQuizState, setNumberOfQuestions: setContextNumberOfQuestions } = useQuiz();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState<number>(25);


  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (!ACCEPTED_FILE_TYPES.some(type => selectedFile.name.toLowerCase().endsWith(type))) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: `Please upload a supported file type: ${ACCEPTED_FILE_TYPES.join(', ')}.`,
        });
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `File size cannot exceed ${MAX_FILE_SIZE_MB} MB.`,
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select or drop a file to generate a quiz.',
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0); 

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setUploadProgress(progress);
      } else {
        clearInterval(interval);
      }
    }, 100);
    
    try {
      const content = await readFileContent(file);
      clearInterval(interval);
      setUploadProgress(100); 
      
      resetQuiz(); 
      setDocumentContent(content);
      setContextNumberOfQuestions(numQuestions);
      setQuizState('loading'); 
      router.push('/quiz');
    } catch (error) {
      clearInterval(interval); 
      setUploadProgress(0);
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Error Processing File',
        description: (error as Error).message || 'Could not process the uploaded file.',
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-background to-secondary/30 dark:from-background dark:to-secondary/10">
      <div className="absolute top-4 right-4">
        <ThemeToggleButton />
      </div>
      <Card className="w-full max-w-lg shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary/10 dark:bg-primary/20 p-6">
          <div className="flex justify-center items-center mb-4">
            <QLogo size={64} />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">inQuizzes</CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Upload your document and let AI generate a quiz for you!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/70'}
              dark:${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-input')?.click()}
            role="button"
            tabIndex={0}
            aria-label="File upload drop zone"
          >
            <UploadCloud className="w-16 h-16 text-primary mb-4" />
            <p className="text-center text-foreground">
              {file ? file.name : 'Drag & drop a file here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Supported: {ACCEPTED_FILE_TYPES.join(', ')} (up to {MAX_FILE_SIZE_MB}MB).
            </p>
            <Input
              id="file-upload-input"
              type="file"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
              accept={ACCEPTED_FILE_TYPES.join(',')}
            />
          </div>

          {file && uploadProgress > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Uploading: {file.name}</p>
              <Progress value={uploadProgress} className="w-full h-3 [&>div]:bg-primary" />
            </div>
          )}

          {file && !isLoading && uploadProgress === 0 && (
             <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Selected: <strong>{file.name}</strong>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="num-questions-slider" className="font-medium text-foreground">
              Number of Questions: <span className="text-primary font-semibold">{numQuestions}</span>
            </Label>
            <Slider
              id="num-questions-slider"
              value={[numQuestions]}
              onValueChange={(value) => setNumQuestions(value[0])}
              min={5}
              max={50}
              step={5}
              className="w-full"
              aria-label="Select number of questions"
            />
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!file || isLoading}
            className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md transition-transform hover:scale-105"
            aria-label={`Generate ${numQuestions} Questions Quiz from selected file`}
          >
            {isLoading ? 'Processing...' : `Generate Quiz (${numQuestions} Questions)`}
          </Button>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>inQuizzes is powered by AI magic.</p>
      </footer>
    </main>
  );
}
