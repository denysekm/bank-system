-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: my_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bank_account`
--

DROP TABLE IF EXISTS `bank_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_account` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `AccountNumber` varchar(24) NOT NULL,
  `ClientID` int NOT NULL,
  `login` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` varchar(255) NOT NULL,
  `ParentAccountID` int DEFAULT NULL,
  `MustChangeCredentials` tinyint NOT NULL DEFAULT '0',
  `Balance` decimal(15,2) DEFAULT '0.00',
  `LastUsernameChange` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `login` (`login`),
  UNIQUE KEY `uq_bank_account_accountnumber` (`AccountNumber`),
  KEY `ClientID` (`ClientID`),
  KEY `fk_bank_account_parent` (`ParentAccountID`),
  CONSTRAINT `bank_account_ibfk_1` FOREIGN KEY (`ClientID`) REFERENCES `client` (`ID`),
  CONSTRAINT `fk_bank_account_parent` FOREIGN KEY (`ParentAccountID`) REFERENCES `bank_account` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bank_card`
--

DROP TABLE IF EXISTS `bank_card`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_card` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `BankAccountID` int NOT NULL,
  `CardNumber` char(16) NOT NULL,
  `CVV` int NOT NULL,
  `EndDate` date NOT NULL,
  `CardType` varchar(50) NOT NULL,
  `Balance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `Brand` varchar(20) NOT NULL DEFAULT 'VISA',
  PRIMARY KEY (`id`),
  UNIQUE KEY `CardNumber` (`CardNumber`),
  KEY `BankAccountID` (`BankAccountID`),
  CONSTRAINT `bank_card_ibfk_1` FOREIGN KEY (`BankAccountID`) REFERENCES `bank_account` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `child_invitation`
--

DROP TABLE IF EXISTS `child_invitation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `child_invitation` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ParentAccountID` int NOT NULL,
  `FullName` varchar(255) NOT NULL,
  `BirthNumber` varchar(20) NOT NULL,
  `BirthDate` date NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Token` varchar(64) NOT NULL,
  `ExpiresAt` datetime NOT NULL,
  `Used` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `ParentAccountID` (`ParentAccountID`),
  CONSTRAINT `child_invitation_ibfk_1` FOREIGN KEY (`ParentAccountID`) REFERENCES `bank_account` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client`
--

DROP TABLE IF EXISTS `client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(255) NOT NULL,
  `BirthDate` date NOT NULL,
  `PassportNumber` varchar(20) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `ClientType` varchar(50) NOT NULL,
  `IsMinor` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `PassportNumber` (`PassportNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `credit`
--

DROP TABLE IF EXISTS `credit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ClientID` int NOT NULL,
  `BankAccountID` int NOT NULL,
  `CardNumber` varchar(19) NOT NULL,
  `PrincipalAmount` decimal(15,2) NOT NULL,
  `amount` double NOT NULL,
  `InterestRate` decimal(5,2) NOT NULL,
  `TermMonths` int NOT NULL,
  `Status` varchar(50) NOT NULL,
  `MonthlyPayment` decimal(15,2) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `ClientID` (`ClientID`),
  KEY `BankAccountID` (`BankAccountID`),
  CONSTRAINT `credit_ibfk_1` FOREIGN KEY (`ClientID`) REFERENCES `client` (`ID`),
  CONSTRAINT `credit_ibfk_2` FOREIGN KEY (`BankAccountID`) REFERENCES `bank_account` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loan_applications`
--

DROP TABLE IF EXISTS `loan_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_applications` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `BankAccountID` int NOT NULL,
  `RequestedAmount` decimal(15,2) NOT NULL,
  `DurationMonths` int NOT NULL,
  `MonthlyIncome` decimal(15,2) NOT NULL,
  `OtherObligations` decimal(15,2) DEFAULT '0.00',
  `Status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `RejectionReason` text,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  KEY `fk_app_account` (`BankAccountID`),
  CONSTRAINT `fk_app_account` FOREIGN KEY (`BankAccountID`) REFERENCES `bank_account` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loan_installments`
--

DROP TABLE IF EXISTS `loan_installments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_installments` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `LoanID` int NOT NULL,
  `InstallmentNumber` int NOT NULL,
  `DueDate` date NOT NULL,
  `Amount` decimal(15,2) NOT NULL,
  `PaidDate` datetime DEFAULT NULL,
  `Status` enum('PENDING','PAID','OVERDUE') DEFAULT 'PENDING',
  PRIMARY KEY (`ID`),
  KEY `fk_inst_loan` (`LoanID`),
  CONSTRAINT `fk_inst_loan` FOREIGN KEY (`LoanID`) REFERENCES `loans` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loans`
--

DROP TABLE IF EXISTS `loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loans` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ApplicationID` int NOT NULL,
  `BankAccountID` int NOT NULL,
  `PrincipalAmount` decimal(15,2) NOT NULL,
  `RemainingAmount` decimal(15,2) NOT NULL,
  `InterestRate` decimal(5,2) NOT NULL DEFAULT '5.00',
  `APR` decimal(5,2) NOT NULL DEFAULT '5.20',
  `DurationMonths` int NOT NULL,
  `MonthlyInstallment` decimal(15,2) NOT NULL,
  `StartDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `Status` enum('ACTIVE','PAID','DEFAULTED') DEFAULT 'ACTIVE',
  PRIMARY KEY (`ID`),
  KEY `fk_loan_app` (`ApplicationID`),
  KEY `fk_loan_account` (`BankAccountID`),
  CONSTRAINT `fk_loan_account` FOREIGN KEY (`BankAccountID`) REFERENCES `bank_account` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_loan_app` FOREIGN KEY (`ApplicationID`) REFERENCES `loan_applications` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_transaction`
--

DROP TABLE IF EXISTS `payment_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transaction` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `sender` varchar(255) NOT NULL,
  `receiver` varchar(255) NOT NULL,
  `Amount` double NOT NULL,
  `Note` varchar(255) DEFAULT NULL,
  `TransactionDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `BankAccountID` int NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `fk_payment_acc` (`BankAccountID`),
  CONSTRAINT `fk_payment_acc` FOREIGN KEY (`BankAccountID`) REFERENCES `bank_account` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-02 17:31:13
