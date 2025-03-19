require('dotenv').config();
console.log("Environment Variables:", process.env.BASE_URL, process.env.NODE_ENV, process.env.MONGODB_URI);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const DataSchema = new mongoose.Schema({
    Archivierungsobjekt: String,
    O_EN: String,
    O_DE: String,
    Vorgaenger: String,
    V_DE: String
}, { collection: 'ARCH_NET' });

const Data = mongoose.model('Data', DataSchema);

app.get('/api/data', async (req, res) => {
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const groupByArchivierungsobjekt = req.query.groupByArchivierungsobjekt === 'true';
    
    try {
        let data;
        if (groupByArchivierungsobjekt) {
            data = await Data.aggregate([
                { $match: filter },
                { $group: { 
                    _id: "$Archivierungsobjekt", 
                    Archivierungsobjekt: { $first: "$Archivierungsobjekt" },
                    O_EN: { $first: "$O_EN" },
                    O_DE: { $first: "$O_DE" }
                }}
            ]);
        } else {
            data = await Data.find(filter);
        }
        res.json(data);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/api/vorgaenger', async (req, res) => {
    const archivierungsobjekt = req.query.archivierungsobjekt;

    try {
        const result = await Data.aggregate([
            { $match: { Archivierungsobjekt: archivierungsobjekt } },
            {
                $graphLookup: {
                    from: 'ARCH_NET',
                    startWith: '$Vorgaenger',
                    connectFromField: 'Vorgaenger',
                    connectToField: 'Archivierungsobjekt',
                    as: 'vorgaengerHierarchy',
                    maxDepth: 10,
                    depthField: 'level'
                }
            },
            {
                $project: {
                    _id: 1,
                    Archivierungsobjekt: 1,
                    O_EN: 1,
                    O_DE: 1,
                    vorgaengerHierarchy: {
                        $cond: {
                            if: {
                                $and: [
                                    { $eq: [{ $size: '$vorgaengerHierarchy' }, 0] },
                                    { $ne: ['$Vorgaenger', null] }
                                ]
                            },
                            then: [{
                                Archivierungsobjekt: '$Vorgaenger',
                                O_EN: '$V_EN',
                                O_DE: '$V_DE',
                                level: 0,

                            }],
                            else: '$vorgaengerHierarchy'
                        }
                    }
                }
            }
        ]);

        res.json(result);
    } catch (err) {
        res.status(500).send(err);
    }
});



const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app;
