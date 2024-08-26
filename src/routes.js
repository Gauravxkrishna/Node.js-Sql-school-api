const express = require('express');
const router = express.Router();
const connection = require('./db');

// Add School API
router.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || !latitude || !longitude) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    connection.query(query, [name, address, latitude, longitude], (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Database error' });
        }
        res.status(201).send({ message: 'School added successfully', schoolId: results.insertId });
    });
});

// List Schools API
router.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).send({ error: 'Latitude and longitude are required' });
    }

    const query = 'SELECT id, name, address, latitude, longitude FROM schools';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Database error' });
        }

        const schools = results.map(school => {
            const distance = calculateDistance(latitude, longitude, school.latitude, school.longitude);
            return { ...school, distance };
        });

        schools.sort((a, b) => a.distance - b.distance);

        res.status(200).send(schools);
    });
});

router.get('/schools', (req, res) => {
    const query = 'SELECT id, name, address, latitude, longitude FROM schools';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching schools:', err);
            return res.status(500).send({ error: 'Database error' });
        }

        res.status(200).send(results);  // Return the fetched school data as JSON
    });
});

router.delete('/deleteSchool/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send({ error: 'School ID is required' });
    }

    const query = 'DELETE FROM schools WHERE id = ?';
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Database error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).send({ error: 'School not found' });
        }

        res.status(200).send({ message: 'School deleted successfully' });
    });
});


// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

module.exports = router;
