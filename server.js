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

    // Initialize the 32 columns (weeks) with empty data
    const weeks = Array.from({ length: 32 }, () => Array(7).fill({ on: false }));

    sortedContributions.forEach(contribution => {
      const contributionDate = new Date(contribution.date);
      const differenceInDays = Math.floor((today - contributionDate) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(differenceInDays / 7);
      const dayOfWeek = contributionDate.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

      // Ensure the week index is within the 32 weeks
      if (weekIndex < 32) {
        weeks[weekIndex][dayOfWeek] = { on: contribution.level > 0 };
      }
    });

    // Flatten the weeks array into a single array for easier processing on the client side
    const formattedContributions = weeks.flatMap((week, weekIndex) => 
      week.map((day, dayOfWeek) => ({
        id: weekIndex * 7 + dayOfWeek,
        dayOfWeek,
        on: day.on
      }))
    );

    // Send the formatted data as the response
    res.json(formattedContributions);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
