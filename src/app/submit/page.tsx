'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const [essay, setEssay] = useState('');
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadSampleEssay = () => {
    const sampleEssay = `Some people think a happy job is more important. Other people think a permanent job is more important. In my opinion, it is more important to have a permanent job.

Having a permanent job is very important for people. A people need money for live. For example, if a man have family, he must to buy food and pay for his house. If he lose his job, his family will be in a big problem. So, job security is very need for everyone. Also, if you have a permanent job, the bank can give you money for a car or house. This is very good for life.

Job satisfaction is also good. People want to feel happy when they work. If you like your job, you will not feel stress. But if the job is not permanent, the happy is not for a long time. Maybe today you are happy but tomorrow you have no job. This is a very bad situation. You can not be happy if you have no money to buy things. So enjoying a job is not the first thing.

In conclusion, I think have a permanent job is more important than a happy job. Security for family and life is the main thing. A person need security first. Then he can find happy in his job. So job security is best.`;
    
    setEssay(sampleEssay);
    setStudentName('Sample Student');
    setClassName('IELTS Writing Class');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!essay.trim()) {
      setError('Please enter your essay');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze-essay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          essay: essay.trim(),
          studentName: studentName.trim(),
          className: className.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze essay');
      }

      const reportData = await response.json();
      
      // Store the report data in sessionStorage for the report page
      sessionStorage.setItem('reportData', JSON.stringify(reportData));
      
      // Redirect to report page
      router.push('/report');
      
    } catch (err) {
      console.error('Error submitting essay:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing your essay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              IELTS Writing Task 2 Analysis
            </h1>
            <p className="text-gray-600">
              Submit your essay for detailed feedback and improvement suggestions
            </p>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <h3 className="font-bold text-yellow-800 mb-2">IELTS Writing Question</h3>
            <p className="text-gray-700 text-sm">
              Some people believe that job satisfaction is more important than job security. 
              Others believe that you cannot expect to always enjoy your job and that having 
              a permanent job is more important. Discuss both views and give your own opinion.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name (Optional)
                </label>
                <input
                  type="text"
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name (Optional)
                </label>
                <input
                  type="text"
                  id="className"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your class name"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="essay" className="block text-sm font-medium text-gray-700">
                  Your Essay *
                </label>
                <button
                  type="button"
                  onClick={loadSampleEssay}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Load Sample Essay
                </button>
              </div>
              <textarea
                id="essay"
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                placeholder="Paste or type your IELTS Writing Task 2 essay here..."
                required
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {essay.length} characters
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="text-center">
              <button
                type="submit"
                disabled={loading || !essay.trim()}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                  loading || !essay.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing Essay...
                  </div>
                ) : (
                  'Analyze Essay'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Your essay will be analyzed using advanced AI to provide detailed feedback 
              on grammar, vocabulary, coherence, and task response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
