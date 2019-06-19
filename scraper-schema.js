'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scraperSchema = new Schema({
    url: {
        type: String,
        unique: true
    },
    totalRef: Number,
    params: String
});