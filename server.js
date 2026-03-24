const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // For generating IDs

const app = express();
const PORT = 3000;

// In-memory array to store donors (resets on server restart)
let donorsDB = [];

// Middleware to read JSON data sent from your frontend form
app.use(express.json());

// Tell the server to serve your HTML, CSS, and JS files from the current folder
app.use(express.static(__dirname));

// GET Endpoint: Sends the list of donors to the frontend when the page loads
app.get('/api/donors', async (req, res) => {
    try {
        const now = new Date();
        
        donorsDB = donorsDB.map(d => {
            if (d.suspended && d.suspendUntil && new Date(d.suspendUntil) <= now) {
                d.suspended = false;
                delete d.suspendUntil;
            }
            return d;
        });

        res.json(donorsDB);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST Endpoint: Receives a new donor from the frontend form and saves it
app.post('/api/register-donor', async (req, res) => {
    try {
        const newDonor = req.body;
        newDonor.id = crypto.randomUUID(); // Generate a unique ID
        donorsDB.push(newDonor);
        res.json({ message: "Success!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE Endpoint: Deletes a donor based on their Firestore ID
app.delete('/api/donors/:id', async (req, res) => {
    try {
        donorsDB = donorsDB.filter(d => d.id !== req.params.id);
        res.json({ message: "Donor deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST Endpoint: Toggles suspension status of a donor by Firestore ID
app.post('/api/donors/:id/suspend', async (req, res) => {
    try {
        const donorIndex = donorsDB.findIndex(d => d.id === req.params.id);
        
        if (donorIndex === -1) return res.status(404).json({ message: "Donor not found" });
        
        if (!donorsDB[donorIndex].suspended) {
            const suspendUntil = new Date();
            suspendUntil.setMonth(suspendUntil.getMonth() + 3); // Add 3 months
            donorsDB[donorIndex].suspended = true;
            donorsDB[donorIndex].suspendUntil = suspendUntil.toISOString();
            res.json({ message: 'Donor suspended for 3 months successfully' });
        } else {
            donorsDB[donorIndex].suspended = false;
            delete donorsDB[donorIndex].suspendUntil;
            res.json({ message: 'Donor activated successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running! Open your browser and go to http://localhost:${PORT}`);
});