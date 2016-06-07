var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var fs = require('fs');
var pdf = require('html-pdf');
var uuid = require('uuid');
var path = require('path');
var nodemailer = require('nodemailer');
var port = process.env.PORT || 8080;
var app = express();

var transporter = nodemailer.createTransport('smtps://apps%40golivelabs.io:Pass1110@smtp.gmail.com');
var JSONBody = bodyParser.json({ type: 'application/json'});
app.use(cors());
app.use('/public', express.static(__dirname + '../tmp'));
var textBody = bodyParser.text({ type: 'text/html', limit: '1mb'});

app.post('/signup', JSONBody, function(req, res) {

        var mailOptions = {
            from: '"Invitations" <apps@golivelabs.io>', // sender address
            to: 'kg@golivelabs.io', // list of receivers
            subject: req.body.name + ' is requesting access to UxPass', // Subject line
            text: req.body.name + ' requested access to UxPass. Here is their information: \n' + 'Name: ' + req.body.name + '\nEmail: ' + req.body.email, // plaintext body
            html: req.body.name + ' requested access to UxPass. Here is their information: \n' + 'Name: ' + req.body.name + '\nEmail: ' + req.body.email // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
            res.sendStatus(200);
        });

});


app.post('/html2pdf', JSONBody, function(req, res) {
    var uid = uuid.v1();
    var pdfOptions = {
        format: 'letter',
        orientation: 'portrait',
        border: '0.5in'
    };

    try {
        pdf.create(req.body.htmlString, pdfOptions).toFile('../tmp/' + req.body.fileName + '.pdf', function(err, res) {
            if(err) {
                console.log('there was an error:', err);
                return;
            }
            console.log(res.filename);
        });
    } catch(e) {
        console.error(e);
    }
    console.log(req.body.fileName)
    res.send('https://htmln2pdf.herokuapp.com/public/' + req.body.fileName + '.pdf');
});

app.listen(port);
