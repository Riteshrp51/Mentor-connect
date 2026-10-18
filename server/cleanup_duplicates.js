import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MentorshipRequest from './models/MentorshipRequest.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

dotenv.config();

const cleanDuplicates = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mentorconnect';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for cleanup...');

    // 1. Fetch all requests
    const allRequests = await MentorshipRequest.find().sort({ createdAt: -1 });
    console.log(`Found ${allRequests.length} total MentorshipRequests.`);

    // Group requests by (studentId + '_' + mentorId)
    const requestGroups = {};
    for (const req of allRequests) {
      const key = `${req.studentId.toString()}_${req.mentorId.toString()}`;
      if (!requestGroups[key]) {
        requestGroups[key] = [];
      }
      requestGroups[key].push(req);
    }

    // For any group with > 1 request, keep the preferred one
    for (const [key, requests] of Object.entries(requestGroups)) {
      if (requests.length > 1) {
        console.log(`Duplicate requests found for pair ${key}: count = ${requests.length}`);
        const bestRequest = requests.find(r => r.topic !== 'aa' && r.topic !== 'test') || requests[0];
        console.log(`Keeping request: id=${bestRequest._id}, topic="${bestRequest.topic}"`);

        const toDelete = requests.filter(r => r._id.toString() !== bestRequest._id.toString());
        for (const reqDel of toDelete) {
          console.log(`Deleting duplicate request: id=${reqDel._id}, topic="${reqDel.topic}"`);
          await MentorshipRequest.deleteOne({ _id: reqDel._id });
        }
      }
    }

    // 2. Fetch all conversations
    const allConvs = await Conversation.find().sort({ updatedAt: -1 });
    console.log(`Found ${allConvs.length} total Conversations.`);

    // Group conversations by sorted participant IDs
    const convGroups = {};
    for (const conv of allConvs) {
      const partIds = (conv.participants || []).map(p => p.toString()).sort().join('_');
      if (!convGroups[partIds]) {
        convGroups[partIds] = [];
      }
      convGroups[partIds].push(conv);
    }

    // For any group with > 1 conversation, merge messages into primary and delete duplicate conversation
    for (const [partIds, convs] of Object.entries(convGroups)) {
      if (convs.length > 1) {
        console.log(`Duplicate conversations found for participants ${partIds}: count = ${convs.length}`);
        const primaryConv = convs[0];
        console.log(`Keeping primary conversation: id=${primaryConv._id}`);

        const duplicates = convs.slice(1);
        for (const dupConv of duplicates) {
          console.log(`Migrating messages from dup conversation: id=${dupConv._id} to ${primaryConv._id}`);
          await Message.updateMany(
            { conversationId: dupConv._id },
            { $set: { conversationId: primaryConv._id } }
          );

          console.log(`Deleting duplicate conversation: id=${dupConv._id}`);
          await Conversation.deleteOne({ _id: dupConv._id });
        }
      }
    }

    console.log('Cleanup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
};

cleanDuplicates();
