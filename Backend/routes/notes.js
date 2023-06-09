const express = require('express');
const router = express.Router();
var fetchuser = require("../middleware/fetchuser");
const Note = require('../models/Note')
const { body, validationResult } = require('express-validator');

// Route 1: Get all the notes
router.get('/fetchallnotes', fetchuser, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id })
        res.json(notes)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }


})

// Route 2 : Add a new Note using : POST "/api/auth/addnotes", Login require
router.post('/addnotes', fetchuser, [
    body('title', 'Enter a valid title').isLength({ min: 3 }),
    body('description', 'description must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {

    try {
        const { title, description, tag } = req.body;
        // If there are errors, return Bad request and the errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400), json({ errors: errors.array() });
        }

        const note = new Note({
            title, description, tag, user: req.user.id
        })
        const saveNotes = await note.save()
        res.json(saveNotes)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }

})

// Route 3 : Update an existing Note using : PUT "/api/auth/updatenote", Login require

router.put('/updatenote/:id', fetchuser, async (req, res) => {
    const { title, description, tag } = req.body;
    try {

        // create a newNotes object
        const newNote = {};
        if (title) { newNote.title = title };
        if (description) { newNote.description = description };
        if (tag) { newNote.tag = tag };

        // checking the note present are not for updating
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not Found") }

        // checking the user who updating the notes
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("not Allowed");
        }

        // updating the existing node
        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true })
        res.json({ note });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }

})

// Route 4 : Delete an existing Note using : DELETE "/api/auth/deletenote", Login require

router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    try {

        // Find the note to be delete and delete it
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not Found") }

        // Allow deletion only user own this note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("not Allowed");
        }
        // updating the existing node
        note = await Note.findByIdAndDelete(req.params.id)
        res.json({ "Success": "Note has been deleted" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }

})
module.exports = router