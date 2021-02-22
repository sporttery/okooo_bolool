/*
 Navicat Premium Data Transfer

 Source Server         : bolool
 Source Server Type    : MySQL
 Source Server Version : 50732
 Source Host           : www.database.com:17816
 Source Schema         : bolool

 Target Server Type    : MySQL
 Target Server Version : 50732
 File Encoding         : 65001

 Date: 22/02/2021 16:38:27
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_bolool30
-- ----------------------------
DROP TABLE IF EXISTS `t_bolool30`;
CREATE TABLE `t_bolool30` (
  `id` int(11) unsigned NOT NULL COMMENT 'match_id',
  `hscore` tinyint(4) unsigned DEFAULT NULL,
  `ascore` tinyint(4) unsigned DEFAULT NULL,
  `hresult` varchar(100) DEFAULT NULL,
  `aresult` varchar(100) DEFAULT NULL,
  `hsection` tinyint(2) unsigned DEFAULT NULL,
  `asection` tinyint(2) unsigned DEFAULT NULL,
  `insertTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `version` int(11) unsigned DEFAULT '0',
  `updateTime` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='最近30场的比赛，包括全部比赛，不去掉友谊赛\n俱乐部最近33场比赛，要去掉友谊赛，但是国家队比赛保留友谊赛';

-- ----------------------------
-- Table structure for t_bolool33
-- ----------------------------
DROP TABLE IF EXISTS `t_bolool33`;
CREATE TABLE `t_bolool33` (
  `id` int(11) unsigned NOT NULL COMMENT 'match_id',
  `hscore` tinyint(4) unsigned DEFAULT NULL,
  `ascore` tinyint(4) unsigned DEFAULT NULL,
  `hresult` varchar(100) DEFAULT NULL,
  `aresult` varchar(100) DEFAULT NULL,
  `hsection` tinyint(2) unsigned DEFAULT NULL,
  `asection` tinyint(2) unsigned DEFAULT NULL,
  `insertTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `version` int(11) unsigned DEFAULT '0',
  `updateTime` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='俱乐部最近33场比赛，要去掉友谊赛，但是国家队比赛保留友谊赛\n最近30场的比赛，包括全部比赛，不去掉友谊赛';

-- ----------------------------
-- Table structure for t_match
-- ----------------------------
DROP TABLE IF EXISTS `t_match`;
CREATE TABLE `t_match` (
  `id` int(11) NOT NULL COMMENT 'match_id',
  `leagueId` int(11) DEFAULT NULL,
  `leagueName` varchar(50) DEFAULT NULL,
  `leagueType` varchar(15) DEFAULT NULL COMMENT 'league,cup,friend',
  `seasonId` int(11) DEFAULT NULL,
  `seasonName` varchar(50) DEFAULT NULL,
  `round` varchar(50) DEFAULT NULL,
  `homeId` int(11) DEFAULT NULL,
  `homeName` varchar(50) DEFAULT NULL,
  `awayId` int(11) DEFAULT NULL,
  `awayName` varchar(50) DEFAULT NULL,
  `playtime` datetime DEFAULT NULL,
  `fullscore` varchar(20) DEFAULT NULL,
  `halfscore` varchar(20) DEFAULT NULL,
  `result` varchar(20) DEFAULT NULL,
  `goalscore` int(11) DEFAULT NULL,
  `insertTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `version` int(11) unsigned DEFAULT '0',
  `updateTime` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for t_match_history
-- ----------------------------
DROP TABLE IF EXISTS `t_match_history`;
CREATE TABLE `t_match_history` (
  `id` int(11) NOT NULL COMMENT 'match_id',
  `matchlist` json DEFAULT NULL,
  `insertTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `version` int(11) unsigned DEFAULT '0',
  `updateTime` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for t_match_odds
-- ----------------------------
DROP TABLE IF EXISTS `t_match_odds`;
CREATE TABLE `t_match_odds` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `s` decimal(5,2) DEFAULT NULL COMMENT '胜',
  `p` decimal(5,2) DEFAULT NULL COMMENT '平',
  `f` decimal(5,2) DEFAULT NULL COMMENT '负',
  `h` decimal(5,2) DEFAULT NULL COMMENT '主',
  `pan` varchar(50) DEFAULT NULL COMMENT '盘口',
  `a` decimal(5,2) DEFAULT NULL COMMENT '客',
  `companyId` int(11) DEFAULT NULL,
  `insertTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `matchId` int(10) unsigned DEFAULT NULL COMMENT 'matchId',
  `version` int(11) unsigned DEFAULT '0',
  `updateTime` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_match_company_id` (`companyId`,`matchId`) USING BTREE,
  KEY `idx_match_id` (`matchId`) USING BTREE,
  KEY `idx_europe` (`s`,`p`,`f`) USING HASH,
  KEY `idx_asia` (`h`,`pan`,`a`) USING HASH
) ENGINE=InnoDB AUTO_INCREMENT=434624 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for t_user
-- ----------------------------
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userName` varchar(45) DEFAULT NULL,
  `userPwd` varchar(45) DEFAULT NULL,
  `userMobile` varchar(11) DEFAULT NULL,
  `userQq` varchar(45) DEFAULT NULL,
  `userWeixin` varchar(45) DEFAULT NULL,
  `userMoney` int(11) DEFAULT NULL COMMENT '余额,分为单位，显示时除10',
  `userStatus` int(11) unsigned DEFAULT NULL COMMENT '状态 0 未激活 1 正常 2 异常 3 自己注销',
  `lastLoginTime` datetime DEFAULT NULL,
  `lastLoginIp` varchar(150) DEFAULT NULL,
  `leidaExpire` datetime DEFAULT NULL COMMENT '雷达过期时间',
  `commission` int(255) DEFAULT '7' COMMENT '佣金比例，整数，计算时要除100',
  `earningsYield` int(255) DEFAULT '20' COMMENT '收益比例，整数，计算时要除100',
  `inserttime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `firstMoney` int(11) DEFAULT NULL COMMENT '起投金额',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `userMobile` (`userMoney`) USING BTREE,
  KEY `userName` (`userName`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for t_user_order
-- ----------------------------
DROP TABLE IF EXISTS `t_user_order`;
CREATE TABLE `t_user_order` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `money` int(255) unsigned NOT NULL COMMENT '投注金额',
  `earningsYield` int(255) DEFAULT NULL COMMENT '返奖率,整数，计算时除以100',
  `odds` decimal(5,2) NOT NULL COMMENT '赔率',
  `isWin` tinyint(255) NOT NULL COMMENT '是否命中 -1 未开奖 0 不中 1 命中 2 取消（算命中，但赔率按1计算）',
  `userId` int(255) NOT NULL COMMENT '记录的所有者',
  `inserttime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_userId` (`userId`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
