const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    comments: [{
        body: String, 
        date: {
            type: Date,
            default: Date.now
        }
    }],
    category: {
        type: String,
        required: true
    },
    date: { 
        type: Date,
        default: Date.now 
    },
    _user:  {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hidden: {
        type: Boolean,
        default: false
    }
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;