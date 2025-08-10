'use client';

import { useEffect, useState } from 'react';
import { Eta } from 'eta';
import dynamic from 'next/dynamic';

// Sample data for fallback
const originalEssayText = `Some people think a happy job is more important. Other people think a permanent job is more important. In my opinion, it is more important to have a permanent job.\n\nHaving a permanent job is very important for people. A people need money for live. For example, if a man have family, he must to buy food and pay for his house. If he lose his job, his family will be in a big problem. So, job security is very need for everyone. Also, if you have a permanent job, the bank can give you money for a car or house. This is very good for life.\n\nJob satisfaction is also good. People want to feel happy when they work. If you like your job, you will not feel stress. But if the job is not permanent, the happy is not for a long time. Maybe today you are happy but tomorrow you have no job. This is a very bad situation. You can not be happy if you have no money to buy things. So enjoying a job is not the first thing.\n\nIn conclusion, I think have a permanent job is more important than a happy job. Security for family and life is the main thing. A person need security first. Then he can find happy in his job. So job security is best.`;

const rewrittenEssayText = `The debate over whether job satisfaction should be prioritised over job security is a defining feature of the modern career landscape. While many advocate for the pursuit of work that provides fulfillment, others contend that the stability of a permanent role is paramount. This essay will argue that while enjoying one's job is important, the financial and psychological security offered by a permanent position holds greater significance.\n\nPrimarily, job security provides an essential foundation for a stable life. For most individuals, a consistent income is not a luxury but a necessity for covering fundamental living expenses such as housing, food, and utilities. Consider a primary breadwinner for a family; an unexpected job loss could plunge the household into immediate financial distress. Therefore, the assurance of a steady paycheck provides peace of mind and allows for long-term financial planning, such as securing a mortgage from a bank, which is often contingent on stable employment.\n\nOn the other hand, the importance of job satisfaction cannot be entirely dismissed. Spending a significant portion of one's life in a role that brings happiness and a sense of purpose can greatly enhance overall well-being and reduce work-related stress. However, this sense of fulfillment can be fleeting if it is not built upon a secure foundation. The anxiety of potential unemployment can overshadow any daily enjoyment derived from the work itself. Ultimately, one cannot truly feel content if basic needs are under constant threat.\n\nIn conclusion, while the allure of a fulfilling job is strong, I am of the opinion that job security is the more critical consideration. It forms the bedrock upon which individuals can build a secure life for themselves and their families. Once this fundamental stability is achieved, one is then in a much better position to seek out and cultivate satisfaction within their professional life.`;

const comparisonData = [{
    id: 1,
    original: "Some people think a happy job is more important. Other people think a permanent job is more important.",
    rewritten: "The debate over whether job satisfaction should be prioritised over job security is a defining feature of the modern career landscape.",
    reason: "Rephrases the simple statement into a sophisticated 'debate' framework, using advanced vocabulary ('prioritised', 'defining feature', 'career landscape').",
    pillars: ["LR", "TR"]
}, {
    id: 2,
    original: "A people need money for live.",
    rewritten: "For most individuals, a consistent income is not a luxury but a necessity for covering fundamental living expenses",
    reason: "Corrects the grammatical error ('A people need') and replaces simple words ('money for live') with more precise phrasing ('consistent income', 'fundamental living expenses').",
    pillars: ["GRA", "LR"]
}, {
    id: 3,
    original: "if a man have family, he must to buy food and pay for his house.",
    rewritten: "Consider a primary breadwinner for a family; an unexpected job loss could plunge the household into immediate financial distress.",
    reason: "Elevates a simple example into a more formal and impactful statement using stronger vocabulary ('breadwinner', 'plunge', 'financial distress').",
    pillars: ["LR", "TR"]
}, {
    id: 4,
    original: "job security is very need for everyone.",
    rewritten: "job security provides an essential foundation for a stable life.",
    reason: "Corrects the word form error ('very need') and uses more academic language ('essential foundation').",
    pillars: ["GRA", "LR"]
}, {
    id: 5,
    original: "the happy is not for a long time.",
    rewritten: "this sense of fulfillment can be fleeting if it is not built upon a secure foundation.",
    reason: "Fixes the grammatical error ('the happy') and uses sophisticated vocabulary ('fleeting', 'built upon a secure foundation').",
    pillars: ["GRA", "LR"]
}, {
    id: 6,
    original: "I think have a permanent job is more important than a happy job.",
    rewritten: "I am of the opinion that job security is the more critical consideration.",
    reason: "Uses a more formal and academic phrase ('I am of the opinion that') and better vocabulary ('critical consideration') to state the thesis.",
    pillars: ["LR", "GRA"]
}];

function ReportPageContent() {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderReport = async () => {
      try {
        // Create a new Eta instance
        const etaInstance = new Eta();

        // Check if we have report data from the submit page
        let reportData;
        const sessionData = sessionStorage.getItem('reportData');
        
        if (sessionData) {
          // Use data from submission
          reportData = JSON.parse(sessionData);
          // Clear the session data after using it
          sessionStorage.removeItem('reportData');
        } else {
          // Fall back to mock data for testing
          reportData = {
            output_json: {
              student_text: originalEssayText,
              rewritten_text: rewrittenEssayText,
              comparison_data: comparisonData,
              overall_score: 6.0,
              task_response: 6.0,
              coherence_cohesion: 6.0,
              lexical_resource: 6.0,
              grammar_accuracy: 6.0,
              examiner_tip: "Focus on improving sentence structure and using more varied vocabulary to enhance your writing."
            },
            readily_submission: {
              submission_json: {
                student_name: "Sample Student",
                class_name: "IELTS Writing Class"
              }
            },
            created_at: new Date().toISOString()
          };
        }

        // Handle the case where output_json is an array
        const outputJson = Array.isArray(reportData.output_json)
          ? reportData.output_json[0]
          : reportData.output_json;

        // Prepare the data for the template
        const templateData = {
          ...outputJson,
          student_text: outputJson.student_text,
          studentName: reportData.readily_submission?.submission_json?.student_name || "Student",
          className: reportData.readily_submission?.submission_json?.class_name || "Class",
          submissionDate: new Date(reportData.created_at).toLocaleDateString(),
        };

        console.log("Template data prepared:", templateData);

        // Fetch the template file
        const response = await fetch("/report.eta");
        if (!response.ok) {
          throw new Error(`Failed to fetch template: ${response.status}`);
        }

        const templateContent = await response.text();

        // Render the template with Eta
        const html = etaInstance.renderString(templateContent, {
          report: templateData,
        });
        console.log("Rendered HTML successfully");

        // Use the rendered HTML directly and define switchTab function after render
        setRenderedHtml(html);
        
        // Define the switchTab function and populateComparison globally after a short delay to ensure DOM is ready
        setTimeout(() => {
          // Define populateComparison function
          const populateComparison = () => {
            console.log('Populating comparison content...');
            const originalContainer = document.getElementById('original-essay');
            const rewrittenContainer = document.getElementById('rewritten-essay');
            
            if (!originalContainer || !rewrittenContainer) {
              console.error('Comparison containers not found');
              return;
            }
            
            const originalText = templateData.student_text || '';
            const rewrittenText = templateData.rewritten_text || '';
            const comparisonData = templateData.comparison_data || [];
            
            let processedOriginal = originalText.replace(/\n/g, '<br><br>');
            let processedRewritten = rewrittenText.replace(/\n/g, '<br><br>');
            
            // Apply highlights for each comparison item
            comparisonData.forEach((item: any) => {
              const originalHighlight = `<span class="highlight highlight-original" data-id="${item.id}">${item.original}</span>`;
              const rewrittenHighlight = `<span class="highlight highlight-rewritten" data-id="${item.id}">${item.rewritten}</span>`;
              processedOriginal = processedOriginal.replace(item.original, originalHighlight);
              processedRewritten = processedRewritten.replace(item.rewritten, rewrittenHighlight);
            });
            
            // Split into paragraphs and populate containers
            originalContainer.innerHTML = processedOriginal.split('<br><br>').map((p: string) => `<p>${p}</p>`).join('');
            rewrittenContainer.innerHTML = processedRewritten.split('<br><br>').map((p: string) => `<p>${p}</p>`).join('');
            
            console.log('Comparison content populated successfully');
          };
          
          (window as any).switchTab = function(tabName: string) {
            console.log('switchTab called with:', tabName);
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked tab
            const targetTab = document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`);
            if (targetTab) {
              targetTab.classList.add('active');
            }
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Show target tab content
            const targetContent = document.getElementById(`${tabName}-content`);
            if (targetContent) {
              targetContent.classList.add('active');
              console.log('Tab switched to:', tabName);
              
              // If switching to comparison tab, populate the content
              if (tabName === 'comparison') {
                setTimeout(populateComparison, 50);
              }
            } else {
              console.error('Target content not found:', `${tabName}-content`);
            }
          };
          
          // Also populate comparison content immediately for initial load
          populateComparison();
          
          console.log('switchTab function and populateComparison are now available globally');
        }, 200);
        
      } catch (err) {
        console.error("Error rendering report:", err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    renderReport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Report</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="report-container"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
      suppressHydrationWarning={true}
    />
  );
}

// Use dynamic import to prevent SSR and hydration issues
const ReportPage = dynamic(() => Promise.resolve(ReportPageContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading report...</p>
      </div>
    </div>
  )
});

export default ReportPage;
