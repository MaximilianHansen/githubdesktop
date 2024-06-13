import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

app.get('/data', async (req, res) => {
  try {
    // Fetch data from the external API
    const response = await fetch('http://localhost:8080/v4/maximilianhansen');
    const data = await response.json();

    // Filter contributions to include only the last 255 days
    const today = new Date();
    const sortedContributions = data.contributions.filter(contribution => {
      const contributionDate = new Date(contribution.date);
      const differenceInDays = Math.floor((today - contributionDate) / (1000 * 60 * 60 * 24));
      return differenceInDays >= 0 && differenceInDays <= 255;
    });

    // Map contributions to the desired format
    const formattedContributions = sortedContributions.map(contribution => {
      const contributionDate = new Date(contribution.date);
      const differenceInDays = Math.floor((today - contributionDate) / (1000 * 60 * 60 * 24));
      return {
        id: differenceInDays,
        on: contribution.level > 0
      };
    });

    // Sort the formatted contributions by id (days ago)
    formattedContributions.sort((a, b) => a.id - b.id);

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
