// controller/user.js
const bcrypt = require("bcrypt");
const { user } = require("../models");
const jwt = require("jsonwebtoken");

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const thisUser = await user.findOne({ where: { email } });

    if (!thisUser) {
      return res.status(404).json({
        message: "등록된 사용자가 없습니다.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, thisUser.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // jwt 토큰 발행
    let accessToken = jwt.sign(
      {
        userID: thisUser.userID,
      },
      process.env.SECRET,
      {
        expiresIn: "1h",
      }
    );

    await thisUser.update({
      token: accessToken,
    });

    res.status(200).json({ message: "로그인 성공", accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
}

async function signup(req, res) {
  const { username, email, password } = req.body;

  try {
    const existingUser = await user.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ message: "이미 등록된 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.create({
      name: username,
      password: hashedPassword,
      email,
    });

    res.status(201).json({ message: "회원가입 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
}

async function logout(req, res) {
  const { userID } = req.decoded;

  try {
    const thisUser = await user.findOne({ where: { userID } });

    if (!thisUser) {
      return res.status(404).json({
        message: "존재하지 않는 유저입니다.",
      });
    }

    await thisUser.update({
      token: null,
    });

    return res.status(200).json({
      message: "로그아웃 성공",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "서버 에러",
    });
  }
}

async function deleteAccount(req, res) {
  const { userID } = req.decoded;

  try {
    const thisUser = await user.findOne({ where: { userID } });

    if (!thisUser) {
      return res.status(404).json({
        message: "존재하지 않는 유저.",
      });
    }

    await user.destroy({
      where: { userID: thisUser.userID },
    });

    return res.status(200).json({
      message: "회원 탈퇴 성공",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "서버 오류",
    });
  }
}

async function getUserInfo(req, res) {
  const { userID } = req.decoded;

  try {
    const userInfo = await user.findOne({
      where: { userID },
      attributes: { exclude: ["password", "token"] }, // 민감한 정보는 제외
    });

    if (!userInfo) {
      return res.status(404).json({ message: "유저 정보를 찾을 수 없습니다." });
    }

    return res.status(200).json({ userInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
}

async function updateUser(req, res) {
  const { userID } = req.decoded;
  const { name, password, email, status } = req.body;

  try {
    const thisUser = await user.findOne({
      where: { userID },
    });

    if (!thisUser) {
      return res.status(404).json({
        message: "유저를 찾을 수 없습니다.",
      });
    }

    // 원하는 수정 로직을 여기에 추가
    // 예: 이름, 비밀번호, 이메일, 상태메시지를 업데이트
    if (name) thisUser.name = name;
    if (password) thisUser.password = password;
    if (email) thisUser.email = email;
    if (status) thisUser.status = status;

    await thisUser.save();

    return res.status(200).json({
      message: "유저 정보가 성공적으로 수정되었습니다.",
      updatedUser: {
        name: thisUser.name,
        email: thisUser.email,
        status: thisUser.status,
        // 원하는 필드 추가 가능
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "유저 정보 수정에 실패했습니다.",
    });
  }
}

module.exports = {
  login,
  signup,
  logout,
  deleteAccount,
  getUserInfo,
  updateUser,
};
