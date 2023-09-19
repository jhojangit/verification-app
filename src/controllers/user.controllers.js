const catchError = require('../utils/catchError');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');
const Emailcode = require('../models/EmailCode');
const jwt = require('jsonwebtoken')


const getAll = catchError(async(req, res) => {
    const results = await User.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
    const {firstName, lastName, email, password, country, image, frontBaseUrl} = await req.body
    const hashedPassword = await bcrypt.hash(password, 10); 
    const result = await User.create({firstName, 
        lastName, 
        email, 
        password: hashedPassword, 
        country, 
        image})

    
    const code = require('crypto').randomBytes(32).toString("hex")
    const link = `${frontBaseUrl}/auth/verify_email/${code}`

    await Emailcode.create({
        code,
        userId: result.id
    })

    
    await sendEmail({
            to: `${email}`,
            subject: "Verificate email for user app",
            html: 
            `
            <div>
                <h1>Hello ${firstName} ${lastName}</h1>

                <p> <b> Thanks for sign in user app</b> </p>

                <p>User created from ${country}</p>

                <a href="${link}">${link}</a>
            </div>
            
            `
    })
    return res.status(201).json(result);
});

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.findByPk(id);
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    await User.destroy({ where: {id} });
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.update(
        req.body,
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});


const verifyEmail = catchError(async(req, res) => {
    const { code } = req.params
    const emailCode = await Emailcode.findOne({where: {code: code}})

    if(!emailCode) return res.status(401).json({message: "Invalid code"})

    const user = await User.update(
        {isVerified: true},
        {where: {id: emailCode.userId}, returning: true}
        )



    await emailCode.destroy()

    return res.json(user)
});

const login = catchError(async(req, res) => {
    const {email, password} = req.body
    const user = await User.findOne({where: {email}})
    if( !user) return res.status(401).json({message: "Invalid credentials"})
    const isValid = await bcrypt.compare(password, user.password)
    if( !isValid) return res.status(401).json({message: "User must be verified"})
    if( !user.isVerified) return res.status(401).json({message: "User must be verified"})
    const token = jwt.sign(
    {user},
    process.env.TOKEN_SECRET,
    {expiresIn: "1d"}
    )

    return res.json({user, token})

})



const getLoggedUser = catchError(async(req, res) => {
    const user = req.user
    return res.json(user)


})



User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
}

module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    verifyEmail,
    login,
    getLoggedUser
}

