const User = require("../../models/user.model");
const UserPet = require("../../models/userpet.model");
const Pet = require("../../models/pet.model");
const Breed = require("../../models/breed.model")
const Service = require("../../models/service.model");
const { responseData } = require("../../helpers/responseData");
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

module.exports = {
    add: async (req, res) => {
        try {
            let { pet_type_id, breed_name, name, size, weight, gender } = req.body
            const user_id = req.user._id

            let file_path = "";
            let existFlag = false
            let image = ''
            if (req.file) {
                image = req.file.filename;
                file_path = path.join(__dirname, '..', '..', 'public', 'images', req.file.filename);
                if (fs.existsSync(file_path)) {
                    existFlag = true
                } else {
                    existFlag = false
                }
            }

            const petExist = await Pet.findById(pet_type_id);
            if (!petExist) {
                // 404 error
                if (existFlag) fs.unlinkSync(file_path);
                return res.json(responseData("PET_NOT_EXIST", {}, req, false));
            }

            if (!breed_name) {
                // 404 error
                if (existFlag) fs.unlinkSync(file_path);
                return res.json(responseData("BREED_NAME_EXIST", {}, req, false));
            }

            if (gender != 'male' && gender != 'female') {
                if (existFlag) fs.unlinkSync(file_path);
                return res.json(responseData("GENDER_DONT_EXIST", {}, req, false));
            }

            if (name.length < 2) {
                if (existFlag) fs.unlinkSync(file_path);
                return res.json(responseData("NAME_LENGTH_MIN", {}, req, false));
            }

            weight = parseInt(weight)
            if (typeof weight != 'number') {
                if (existFlag) fs.unlinkSync(file_path);
                return res.json(responseData("WEIGHT_NOT_NUMBER", {}, req, false));
            }

            if (!image) {
                if (existFlag) fs.unlinkSync(file_path);
                image = ''
            }
            const userpet = {
                user_id,
                pet_type_id,
                breed_name,
                name,
                weight,
                size,
                gender
            }
            if (req.file) {
                userpet.image = image
            }

            var createUserPet = await UserPet.create(userpet)

            if (req.file) {
                createUserPet.image = `${process.env.IMAGE_LOCAL_PATH}${req.file.filename}`
            } else {
                createUserPet.image = `${process.env.IMAGE_LOCAL_PATH}no_image.png`
            }


            return res.json(responseData("PET_ADDED", createUserPet, req, true));

        } catch (error) {
            if (req.file) {
                let image = req.file.filename;
                let file_path = path.join(__dirname, '..', '..', 'public', 'images', req.file.filename);
                if (fs.existsSync(file_path)) {
                    fs.unlinkSync(file_path);
                } else {
                    fs.unlinkSync(file_path);
                }
            }
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    edit: async (req, res) => {
        try {

            const { _id, pet_type_id, breed_name, name, size, gender } = req.body
            let { weight } = req.body

            let file_path = "";
            let existFlag = false
            let image
            if (req.file) {
                image = req.file.filename;
                file_path = path.join(__dirname, '..', '..', 'public', 'images', req.file.filename);
                if (fs.existsSync(file_path)) {
                    existFlag = true
                } else {
                    existFlag = false
                }
            }

            let userPetExist = await UserPet.findById({ _id: ObjectId(_id) })

            if (!userPetExist) {
                if (existFlag) fs.unlinkSync(file_path);
                return res.json(responseData("USER_PET_NOT_EXIST", {}, req, false));
            }

            if (req.user._id != userPetExist.user_id) {
                // 404 error
                if (existFlag) fs.unlinkSync(file_path);
                return res.json(responseData("USER_NOT_MATCH", {}, req, false));
            }

            if (pet_type_id) {
                if (pet_type_id != userPetExist.pet_type_id) {
                    const petExist = await Pet.findById(pet_type_id);
                    if (!petExist) {
                        // 404 error
                        if (existFlag) fs.unlinkSync(file_path);
                        return res.json(responseData("PET_NOT_EXIST", {}, req, false));
                    }
                }
            }

            if (!breed_name) {
                // 404 error
                if (existFlag) fs.unlinkSync(file_path);
                return res.json(responseData("BREED_NAME_EXIST", {}, req, false));
            }

            if (gender != 'male' && gender != 'female') {
                // 404 error
                console.log(gender);
                if (existFlag) fs.unlinkSync(file_path);
                return res.json(responseData("GENDER_DONT_EXIST", {}, req, false));
            }

            if (name) {
                if (name.length < 2) {
                    if (existFlag) fs.unlinkSync(file_path);
                    return res.json(responseData("NAME_LENGTH_MIN", {}, req, false));
                }
            }

            if (weight) {
                weight = parseInt(weight)
                if (typeof weight != 'number') {
                    if (existFlag) fs.unlinkSync(file_path);
                    return res.json(responseData("WEIGHT_NOT_NUMBER", {}, req, false));
                }
            }

            if (!image) {
                if (existFlag) fs.unlinkSync(file_path);
            }

            if (image) {
                if (userPetExist.image) {
                    let old_file_path = path.join(__dirname, '..', '..', 'public', 'images', userPetExist.image);
                    if (fs.existsSync(old_file_path)) {
                        fs.unlinkSync(old_file_path);
                    }
                }
            } else {
                if (userPetExist.image) {
                    image = userPetExist.image
                }
            }

            let updatedData = await UserPet.findByIdAndUpdate({ _id: ObjectId(_id) },
                {
                    $set: {
                        pet_type_id,
                        breed_name,
                        name,
                        weight,
                        size,
                        image,
                        gender,
                        updatedAt: new Date()
                    }
                },
                { returnOriginal: false }
            )

            if (updatedData.image) {
                updatedData.image = `${process.env.IMAGE_LOCAL_PATH}${updatedData.image}`
            } else {
                updatedData.image = `${process.env.IMAGE_LOCAL_PATH}no_image.png`
            }

            return res.json(responseData("PET_UPDATED", updatedData, req, true));

        } catch (error) {
            if (req.file) {
                let image = req.file.filename;
                let file_path = path.join(__dirname, '..', '..', 'public', 'images', req.file.filename);
                if (fs.existsSync(file_path)) {
                    fs.unlinkSync(file_path);
                } else {
                    fs.unlinkSync(file_path);
                }
            }
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    list: async (req, res) => {
        try {

            // let user_id = req.query.user_id;
            let user_id = req.user._id;

            let query;

            // Pagination
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const total = await UserPet.countDocuments({ user_id: ObjectId(user_id) });

            query = UserPet.aggregate([
                {
                    $match: {
                        user_id: ObjectId(user_id)
                    }
                },
                {
                    $sort: { "createdAt": -1 }
                },
                {
                    $skip: startIndex
                },
                {
                    $limit: limit
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "userData"
                    }
                },
                {
                    $lookup: {
                        from: "pets",
                        localField: "pet_type_id",
                        foreignField: "_id",
                        as: "petData"
                    }
                },
                {
                    $unwind: {
                        path: '$userData',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $unwind: {
                        path: '$petData',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        "user_pet_id": "$_id",
                        "name": "$name",
                        "user_id": "$user_id",
                        "pet_type_id": "$pet_type_id",
                        "breed_name": "$breed_name",
                        "size": "$size",
                        "weight": "$weight",
                        "gender": "$gender",
                        "createdAt": "$createdAt",
                        "modefiedAt": "$modefiedAt",
                        "petDataName": "$petData.name",
                        "petDataImage": "$petData.image",
                        "petDataStatus": "$petData.status",
                        "image": {
                            $cond: {
                                if: { "$ne": ["$image", null] },
                                then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$image"] },
                                else: { $concat: [process.env.IMAGE_LOCAL_PATH, "pet-sample.jpg"] },
                            }
                        }
                    }
                }
            ])

            // Executing query
            var results = await query;

            let flag = 0

            if ((total % limit) > 0) {
                flag = parseInt((total / limit)) + 1;
            } else {
                flag = (total / limit)
            }

            // Pagination result

            let paginateme = {
                "totalDocs": total,
                "limit": limit,
                "page": page,
                "totalPages": flag,
                "pagingCounter": page,
                "hasPrevPage": false,
                "hasNextPage": false,
                "prevPage": 0,
                "nextPage": 0
            }

            if (endIndex < total) {
                paginateme.hasNextPage = true
                paginateme.nextPage = page + 1
            }

            if (startIndex > 0) {
                paginateme.hasPrevPage = true
                paginateme.prevPage = page - 1
            }

            let responseCreate = {
                data: results,
                count: results.length,
                ...paginateme,
            }



            return res.json(responseData("GET_LIST", responseCreate, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    delete: async (req, res) => {
        try {
            const { _id } = req.body
            const user_id = req.user._id

            let userPetExist = await UserPet.findOne({ _id: _id, user_id: user_id })
            if (!userPetExist) {
                return res.json(responseData(`PET_NOT_EXIST`, {}, req, false));
            }


            if (userPetExist.image) {
                let old_file_path = path.join(__dirname, '..', '..', 'public', 'images', userPetExist.image);
                if (fs.existsSync(old_file_path)) {
                    fs.unlinkSync(old_file_path);
                }
            }


            await UserPet.findByIdAndDelete(_id)

            return res.json(responseData("PET_DELETED", {}, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
}