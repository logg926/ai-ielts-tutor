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

export { originalEssayText, rewrittenEssayText, comparisonData };
