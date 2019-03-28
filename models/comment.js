const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    body: {
        type: String
    },
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    _post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;