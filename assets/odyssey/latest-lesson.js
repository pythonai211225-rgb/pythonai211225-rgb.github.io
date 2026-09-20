// Append new published lessons to the Mission log; the last one is featured.
// Set data-lesson-topic="ANN" (or another topic short code) for matching artwork.
(() => {
  const featured = document.querySelector('.latest-lesson');
  const lessons = document.querySelectorAll('#lessons .lab-grid > a[href]:not(.lesson-soon)');
  const latest = lessons[lessons.length - 1];
  if (!featured || !latest) return;
  const title = latest.querySelector('h3')?.textContent.trim();
  const label = latest.querySelector('.eyebrow')?.textContent.trim();
  featured.href = latest.href;
  if (title) {
    featured.querySelector('.latest-title, .latest-lesson-title').textContent = title;
    featured.setAttribute('aria-label', `Open latest lesson: ${title}`);
  }
  if (label) featured.querySelector('.latest-number, .latest-lesson-meta').textContent = label.replace(/^LESSON\s*/i, '');
  const description = latest.querySelector('p:not(.eyebrow)')?.textContent.trim();
  // Keep the compact hero readable; the full introduction remains in the log.
  if (description && featured.querySelector('.latest-description')) {
    const summary = description.split(':').pop().split(', then')[0].replace(/\.$/, '');
    featured.querySelector('.latest-description').textContent = summary.charAt(0).toUpperCase() + summary.slice(1) + '.';
  }
  const topicIndex = typeof topics === 'undefined' ? -1 : topics.findIndex(topic => topic.short === latest.dataset.lessonTopic);
  if (topicIndex >= 0) {
    featured.style.setProperty('--latest-x', `${(topicIndex % 3) * 50}%`);
    featured.style.setProperty('--latest-y', `${Math.floor(topicIndex / 3) * 50}%`);
  }
})();
