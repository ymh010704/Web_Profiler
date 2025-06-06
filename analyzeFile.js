const fs = require('fs');

function analyzeFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const blocks = raw.split('\n\n').map(b => b.trim()).filter(Boolean);

  const taskStats = {
    task1: [], task2: [], task3: [], task4: [], task5: []
  };

  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length < 6) continue;

    const dataLines = lines.slice(1); // task 헤더 제외
    for (const line of dataLines) {
      const [core, ...values] = line.split('\t').filter(Boolean);
      values.forEach((v, idx) => {
        const value = Number(v);
        if (Number.isFinite(value) && Number.isInteger(value)) {
          const taskKey = `task${idx + 1}`;
          taskStats[taskKey].push(value);
        } else {
          console.log(`Skipping invalid value in analyzeFile: "${v}"`);
        }
      });
    }
  }

  const result = Object.entries(taskStats).map(([task, values]) => {
    if (values.length === 0) {
      return { task, min: null, max: null, avg: null };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      task,
      min,
      max,
      avg: Number(avg.toFixed(2)),
    };
  });

  return result;
}

module.exports = analyzeFile;