const userModel = require("./routes/users");
const messageModel = require("./routes/messages");
const groupModel = require("./routes/group")



const io = require("socket.io")();
const socketapi = {
    io: io
};

// Add your socket.io logic here!
io.on("connection", function(socket) {
    console.log("A user connected");


    socket.on(`join-server`, async(userdets) => {

        await userModel.findOneAndUpdate({
            username: userdets.username
        }, {
            socketId: socket.id
        })


        const currentUser = await userModel.findOne({
            username: userdets.username,
        });


        const allGroups = await groupModel.find({
            // finding all groups jisme lggedin user add ho taki use show krpaye ejs ke through !
            users: {
                $in: [currentUser._id]
            }
        });

        allGroups.forEach(group => {
            socket.emit('all-groups', group);
        })



        let onlineUsers = await userModel.find({
            socketId: {
                $nin: ["", socket.id]
            }
        })


        onlineUsers.forEach(onlineUser => {
            socket.emit('new-user-join', {
                username: onlineUser.username,
                profileImage: onlineUser.profileImage,
            })
        })

        socket.broadcast.emit('new-user-join', userdets);
    })


    socket.on(`private-message`, async messageObject => {

        const createdmessage = await messageModel.create({
            msg: messageObject.message,
            sender: messageObject.sender,
            receiver: messageObject.receiver,
        });


        const receiver = await userModel.findOne({
            username: messageObject.receiver,
        });


        if (!receiver) {
            // agar kisi siingle user ko message nhi kra toh group ko kra hoga toh us name se group ko dhoondlo

            const group = await groupModel.findOne({
                name: messageObject.receiver,
            }).populate('users');

            if (!group) { return } // agar group nhi mila to

            group.users.forEach(user => {
                socket.to(user.socketId).emit('receive-private-message', messageObject);
            })
        }

        if (receiver)
            socket.to(receiver.socketId).emit('receive-private-message', messageObject);

    })


    socket.on('fetch-conversation', async conversationDetails => {

        const receiverUser = await userModel.findOne({
            username: conversationDetails.receiver,
        })

        if (receiverUser) {
            const allMessages = await messageModel.find({ // ye vli query one to one chat ke liye
                $or: [{
                        sender: conversationDetails.sender, // a
                        receiver: conversationDetails.receiver, // b
                    },
                    {
                        receiver: conversationDetails.sender, // a
                        sender: conversationDetails.receiver, // b
                    }
                ]

            })
            socket.emit('send-conversation', allMessages);
        } else { // ye vli query group chat ke liye
            const allMessages = await messageModel.find({
                receiver: conversationDetails.receiver, // vo vle msgs dhund ke lao jisme receiver grp ho
            })
            socket.emit('send-conversation', allMessages);
        }
    })


    socket.on('create-new-group', async groupDetails => {

        // creating group
        const newGroup = await groupModel.create({
            name: groupDetails.groupName
        });

        // putting first user in group
        const currentUser = await userModel.findOne({
            username: groupDetails.sender,
        });

        newGroup.users.push(currentUser._id);
        await newGroup.save();

        // console.log(newGroup);
        socket.emit('group-created', newGroup);

    })



    socket.on('join-group', async joiningDetails => {


        const group = await groupModel.findOne({
            name: joiningDetails.groupName,
        })

        if (!group) {
            socket.emit(`not-found`, {
                groupName: joiningDetails.groupName,
            })
        } else {

            const currentUser = await userModel.findOne({
                username: joiningDetails.sender,
            });

            group.users.push(currentUser._id);

            await group.save();

            socket.emit(`group-joined`, group);

        }


    })




    socket.on('disconnect', async() => {

        await userModel.findOneAndUpdate({
            socketId: socket.id
        }, {
            socketId: ""
        })

    })




});
// end of socket.io logic

module.exports = socketapi;