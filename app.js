var restify = require('restify');
var builder = require('botbuilder');
var retinaSDK = require('retinasdk');
var fs = require('fs');
//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server

var server = restify.createServer({
    certificate: fs.readFileSync('/home/e3/git/E3-Rebecca/s43.crt'),
    key: fs.readFileSync('/home/e3/git/E3-Rebecca/s43.key'),
    name: 'E3 Rebecca'


});
server.listen(process.env.port || process.env.PORT || 8443, function () {
   console.log('%s listening to %s', server.name, server.url);
});
// Create chat bot
var connector = new builder.ChatConnector({
    appId: "990b5a74-ffee-4c05-a744-21bcc35a46f0",
    appPassword: "7tnLouBUberen8UXpw955QP"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Setup Retina API client
var retinaApiKey = "2ce074b0-d7c7-11e6-a057-97f4c970893c";
var retina = retinaSDK.LiteClient(retinaApiKey);

// Model
var knowledgebase = [
"open sn ticket",
"approve task",
"view task",
"approve request",
"reject task",
"reject request",
"close sn ticket",
"cancel sn ticket",
];

// Model paramters
var fingerprints = [];
knowledgebase.map(sentence => {
	var fp = retina.getFingerprint(sentence);
	fingerprints[sentence] = fp;
});
var matchThreshold = 0.7;

//Bot on
bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me. Say 'hello' to see some great demos.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});
bot.on('typing', function (message) {
  // User is typing
});
bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});
//=========================================================
// Bots Dialogs
//=========================================================
String.prototype.contains = function(content){
  return this.indexOf(content) !== -1;
}

bot.dialog('/', function (session) {

	var messageText = session.message.text;
	var messageFP = retina.getFingerprint(messageText);
	var matches = knowledgebase.filter(sentence => {
		var fp = fingerprints[sentence];
		var metric = retina.compare(messageFP, fp);
		console.log('retina.compare("' + messageText + '", "' + sentence + '") =>' + metric);
		return metric > matchThreshold;
	});
	console.log('"' + messageText + '"' + ' => found matched: ' + matches.length);
	matches.sort();
	if (matches.length > 0) {
		if (matches.length === 1) {
			matches.forEach(sentence => {
				console.log('you meant: ' + sentence);
				session.send('you meant: ' + sentence);
			});
		}
		else {
			console.log('which did you mean:');
			session.send('which did you mean:');
			matches.forEach(sentence => {
				console.log(sentence);
				session.send(sentence);
			});
		}
	}
	else if(messageText.toLowerCase().contains('hello')){
      session.send(`Hey, How are you?`);
      }else if(messageText.toLowerCase().contains('help')){
        session.send(`How can I help you?`);
      }else{
        session.send(`Sorry I don't understand you...`);
      }
});
