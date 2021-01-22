/*
 Navicat Premium Data Transfer

 Source Server         : 127.0.0.1-876543219
 Source Server Type    : MySQL
 Source Server Version : 50732
 Source Host           : localhost:3306
 Source Schema         : bolool

 Target Server Type    : MySQL
 Target Server Version : 50732
 File Encoding         : 65001

 Date: 22/01/2021 18:11:03
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_bolool
-- ----------------------------
DROP TABLE IF EXISTS `t_bolool`;
CREATE TABLE `t_bolool`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'match_id',
  `matchId` int(11) NULL DEFAULT NULL,
  `hscore` tinyint(4) UNSIGNED NULL DEFAULT NULL,
  `ascore` tinyint(4) UNSIGNED NULL DEFAULT NULL,
  `hresult` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `aresult` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `hsection` tinyint(2) UNSIGNED NULL DEFAULT NULL,
  `asection` tinyint(2) UNSIGNED NULL DEFAULT NULL,
  `hstrong` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `astrong` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `topN` tinyint(2) UNSIGNED NULL DEFAULT NULL COMMENT '前多少场比赛',
  `friendly` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '0 没有友谊赛 1 全部比赛 2 只有友谊赛',
  `insertTime` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `version` int(11) UNSIGNED NULL DEFAULT 0,
  `updateTime` timestamp(0) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_match_id`(`matchId`, `topN`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2201 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_match
-- ----------------------------
DROP TABLE IF EXISTS `t_match`;
CREATE TABLE `t_match`  (
  `id` int(11) NOT NULL COMMENT 'match_id',
  `leagueId` int(11) NULL DEFAULT NULL,
  `leagueName` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `leagueType` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'league,cup,friend',
  `seasonId` int(11) NULL DEFAULT NULL,
  `seasonName` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `round` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `homeId` int(11) NULL DEFAULT NULL,
  `homeName` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `awayId` int(11) NULL DEFAULT NULL,
  `awayName` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `playtime` datetime(0) NULL DEFAULT NULL,
  `fullscore` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `halfscore` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `result` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `goalscore` int(11) NULL DEFAULT NULL,
  `insertTime` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `version` int(11) UNSIGNED NULL DEFAULT 0,
  `updateTime` timestamp(0) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_match_history
-- ----------------------------
DROP TABLE IF EXISTS `t_match_history`;
CREATE TABLE `t_match_history`  (
  `id` int(11) NOT NULL COMMENT 'match_id',
  `matchlist` json NULL,
  `insertTime` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `version` int(11) UNSIGNED NULL DEFAULT 0,
  `updateTime` timestamp(0) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_match_odds
-- ----------------------------
DROP TABLE IF EXISTS `t_match_odds`;
CREATE TABLE `t_match_odds`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `s` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '胜',
  `p` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '平',
  `f` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '负',
  `h` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '主',
  `pan` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '盘口',
  `a` decimal(5, 2) NULL DEFAULT NULL COMMENT '客',
  `companyId` int(11) NULL DEFAULT NULL,
  `insertTime` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `matchId` int(10) UNSIGNED NULL DEFAULT NULL COMMENT 'matchId',
  `version` int(11) UNSIGNED NULL DEFAULT 0,
  `updateTime` timestamp(0) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_match_company_id`(`companyId`, `matchId`) USING BTREE,
  INDEX `idx_match_id`(`matchId`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 499 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
