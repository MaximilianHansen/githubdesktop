import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3043;

app.get('/data', async (req, res) => {
  const githubUsername = req.query.githubUsername;  // Extract GitHub username from query parameters

  if (!githubUsername) {
    return res.status(400).json({ error: 'GitHub username is required' });
  }

  try {
    // Fetch data from the external API
    const response = await fetch(`http://54.147.216.5:3042/v4/${githubUsername}`);
    const data = await response.json();

    // Filter contributions to include only the last 255 days
    const today = new Date();
    const sortedContributions = data.contributions.filter(contribution => {
      const contributionDate = new Date(contribution.date);
      const differenceInDays = Math.floor((today - contributionDate) / (1000 * 60 * 60 * 24));
      return differenceInDays >= 0 && differenceInDays <= 255;
    });

    // Initialize a 2D array for 32 weeks (columns) and 7 days (rows)
    const weeks = Array.from({ length: 32 }, () => Array(7).fill(false));

    // Populate the 2D array with contributions data
    sortedContributions.forEach(contribution => {
      const contributionDate = new Date(contribution.date);
      const weekIndex = Math.floor((today - contributionDate) / (1000 * 60 * 60 * 24 * 7));
      const dayOfWeek = contributionDate.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

      // Ensure the weekIndex is within the 32 weeks
      if (weekIndex < 32) {
        weeks[31 - weekIndex][dayOfWeek] = contribution.level > 0;
      }
    });

    // Send the 2D array as the response
    res.json(weeks);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
