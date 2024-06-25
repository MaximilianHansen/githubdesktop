import express from 'express';
import fetch from 'node-fetch';
import moment from 'moment';

const app = express();
const port = 3043;

app.get('/data', async (req, res) => {
  const githubUsername = req.query.githubUsername;

  if (!githubUsername) {
    return res.status(400).json({ error: 'GitHub username is required' });
  }

  try {
    const response = await fetch(`http://54.147.216.5:3042/v4/${githubUsername}`);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch data from the external server' });
    }
    
    const data = await response.json();
    
    const filterByLast223Days = (data) => {
      const today = moment();
      const endOfWeek = today.clone().endOf('week');
      const startDate = endOfWeek.clone().subtract(223, 'days');
      return data.filter(entry => {
        const entryDate = moment(entry.date, 'YYYY-MM-DD');
        return entryDate.isBetween(startDate, endOfWeek, null, '[]');
      });
    };

    const sortByDateDesc = (data) => {
      return data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
    };

    const days = data.contributions;
    const filteredDays = filterByLast223Days(days);
    const filteredSortedDays = sortByDateDesc(filteredDays);

    const bitArray = filteredSortedDays.map(item => item.count !== 0 ? '1' : '0').join('');

    res.json({ bitArray: bitArray });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: 'An error occurred while fetching data' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
