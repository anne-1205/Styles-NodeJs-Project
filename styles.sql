-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 05, 2025 at 09:04 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `styles`
--

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

CREATE TABLE `item` (
  `item_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `sell_price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `product_image` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item`
--

INSERT INTO `item` (`item_id`, `description`, `category`, `cost_price`, `sell_price`, `quantity`, `product_image`, `created_at`, `updated_at`) VALUES
(1, 'Elegant Dress', 'dress', 250.00, 300.00, 30, 'elegant dress-1753435589720-725066061.jpg', '2025-07-24 12:12:29', '2025-07-25 17:26:29'),
(2, 'Elegant Sandals', 'shoes', 200.00, 250.00, 10, '1ded7a9ce29bdfbfa7966956f271e23f-1753341676190-722187532.jpg', '2025-07-24 15:21:16', '2025-07-24 15:21:16'),
(3, 'Crystal Watch Set', 'accessories', 300.00, 400.00, 10, 'Crystal Watch Set-1753435655481-145219612.jpg', '2025-07-25 17:27:35', '2025-07-25 17:27:35'),
(4, 'Levantine Bag', 'bags', 250.00, 300.00, 15, 'Levantine Bag-1753435684366-976048040.jpg', '2025-07-25 17:28:04', '2025-07-25 17:28:04'),
(5, 'Sandals', 'shoes', 150.00, 200.00, 10, 'sandals-1753435710127-644277152.jpg', '2025-07-25 17:28:30', '2025-07-25 17:28:30'),
(6, 'Necklace Set Pearl', 'accessories', 250.00, 300.00, 15, 'Necklace Set-1753435756248-469656127.jpg', '2025-07-25 17:29:16', '2025-07-25 17:29:16'),
(7, 'Stilettos', 'shoes', 400.00, 450.00, 5, 'Stilettos-1753435793116-401179639.jpg', '2025-07-25 17:29:53', '2025-07-25 17:29:53'),
(8, 'Mulberry Leather', 'bags', 350.00, 400.00, 5, 'Mulberry Leather-1753435820374-652161326.jpg', '2025-07-25 17:30:20', '2025-07-25 17:30:20'),
(9, 'Heels', 'shoes', 400.00, 450.00, 10, 'Heels-1753435852951-907790084.jpg', '2025-07-25 17:30:52', '2025-07-25 17:30:52'),
(10, 'Tote Bag', 'bags', 150.00, 200.00, 15, 'Tote Hand Bag-1753435884774-488005185.jpg', '2025-07-25 17:31:24', '2025-07-25 17:31:24'),
(11, 'Pants', 'dress', 100.00, 120.00, 10, 'Stilettos-1753541988821-936628553.jpg', '2025-07-26 22:59:48', '2025-07-26 22:59:48'),
(12, 'Sandals Bowknot', 'shoes', 150.00, 200.00, 5, '451b1cb29d19c3e5d5d92a0ca945589e-1754229423000-250301659.jpg', '2025-08-03 21:52:54', '2025-08-03 21:57:03');

-- --------------------------------------------------------

--
-- Table structure for table `orderinfo`
--

CREATE TABLE `orderinfo` (
  `orderinfo_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date_placed` datetime DEFAULT NULL,
  `date_shipped` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `shipping_address` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_state` varchar(100) DEFAULT NULL,
  `shipping_zip` varchar(20) DEFAULT NULL,
  `shipping_phone` varchar(30) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderinfo`
--

INSERT INTO `orderinfo` (`orderinfo_id`, `user_id`, `date_placed`, `date_shipped`, `status`, `shipping_address`, `shipping_city`, `shipping_state`, `shipping_zip`, `shipping_phone`, `notes`) VALUES
(1, 1, '2025-07-24 17:08:27', '2025-07-24 17:08:27', 'delivered', NULL, NULL, NULL, NULL, NULL, NULL),
(2, 7, '2025-07-25 15:48:18', '2025-07-25 15:48:18', 'delivered', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 1, '2025-07-25 18:29:38', '2025-07-25 18:29:38', 'delivered', 'Makiling Street', 'Taguig', 'Manila', '1630', '09273654434', NULL),
(4, 1, '2025-07-26 22:52:36', '2025-07-26 22:52:36', 'delivered', 'Gate 3', 'Taguig', 'Manila', '2636', '09374834', 'Pick up'),
(5, 15, '2025-08-03 21:39:58', '2025-08-03 21:39:58', 'delivered', 'Makiling Street', 'Makati', 'Manila', '2636', '09123456778', 'Pick up'),
(6, 16, '2025-08-05 09:36:46', '2025-08-05 09:36:46', 'pending', 'Makiling Street', 'Taguig', 'Manila', '1630', '09273654434', 'yes');

-- --------------------------------------------------------

--
-- Table structure for table `orderline`
--

CREATE TABLE `orderline` (
  `orderline_id` int(11) NOT NULL,
  `orderinfo_id` int(11) DEFAULT NULL,
  `item_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderline`
--

INSERT INTO `orderline` (`orderline_id`, `orderinfo_id`, `item_id`, `quantity`) VALUES
(1, 1, 1, 1),
(2, 1, 2, 1),
(3, 2, 2, 1),
(4, 3, 10, 1),
(5, 4, 1, 1),
(6, 5, 10, 2),
(7, 6, 3, 2);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `item_id`, `order_id`, `rating`, `comment`, `created_at`, `updated_at`) VALUES
(3, 1, 1, 4, 5, 'LOVE THIS DRESS', '2025-08-03 13:12:32', '2025-08-03 13:12:32'),
(4, 15, 10, 5, 5, 'Aesthetic and durable bag', '2025-08-03 13:57:56', '2025-08-03 13:57:56');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile_picture` varchar(255) DEFAULT 'default.jpg',
  `role` enum('user','admin') DEFAULT 'user',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `auth_token` varchar(500) DEFAULT NULL,
  `token_expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `profile_picture`, `role`, `status`, `created_at`, `verified`, `verification_token`, `auth_token`, `token_expires_at`) VALUES
(1, 'Hazel Anne Elumba', 'hazel@gmail.com', '$2b$10$v2zad8qbLESdCN2HydUfRObr6cH3IaJZugLh/D/zeazeA/obXOOa2', 'WIN_20250222_15_55_23_Pro-1753752347407-585008837.jpg', 'user', 'active', '2025-07-23 08:36:50', 1, 'd8ba7d08a64fd983e3461d89ba17480a65e28dc8ba374478324bec43b34201db', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU0Mzc2MzI3fQ.mQ4heZMCBDBayW7im5OZAtWJP8FwAYPRYPOkSrA9xLI', '2025-08-06 06:45:27'),
(2, 'Anne', 'anne@gmail.com', '$2b$10$jjvB9L/VTzgzXCeldV4wP.XnH4.M6jYaNrdl9C.7k1ZRlQ9EAEPcK', 'WIN_20250310_13_27_31_Pro-1753261132112-905182097.jpg', 'admin', 'active', '2025-07-23 08:58:52', 1, '301879ab957d97740c967eab859edf640a51d014fe935d8f097d396559c15c06', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzU0MzcyODU0fQ.6or1vR4L8qzY7pH7CHDr4zRWuvS61XTR2qHcrA3WOX8', '2025-08-06 05:47:34'),
(3, 'Girone Acosta', 'girone@gmail.com', '$2b$10$CGjvltHzDdR1hCAWOo.Am.GZmR3hlL.BKzJywU14EWwtiq7MMqUO6', 'WIN_20250310_13_27_26_Pro-1753320856816-674196142.jpg', 'user', 'active', '2025-07-24 01:34:17', 1, NULL, NULL, NULL),
(4, 'Pat Baldesco', 'pat@gmail.com', '$2b$10$DxBy4xyuHINlGB5RoXY9QuT5.HtMHuw7hKZ6OUp1UShFrY7S3Abgi', 'WIN_20250310_13_28_43_Pro-1753428247712-549778984.jpg', 'user', 'active', '2025-07-25 07:24:07', 1, NULL, NULL, NULL),
(6, 'Hanna Gansan', 'hanna@gmail.com', '$2b$10$ai8H7SIm8yt2oEvmhhQIxOTI0rtmKeSemzTLmGIiZHqEw.AFRrQdq', 'WIN_20250222_15_56_01_Pro-1753428574508-206044193.jpg', 'user', 'active', '2025-07-25 07:29:34', 1, NULL, NULL, NULL),
(7, 'Ella Smith', 'ella@gmail.com', '$2b$10$450rLNCmtIRJWuyhLbrmMOmkJ.2wAS3iD1khd/GQ9uYiAMQJPQOpS', 'WIN_20250310_13_27_31_Pro-1753428733270-28902026.jpg', 'user', 'active', '2025-07-25 07:32:13', 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzUzNTMxNTIwfQ.KFgn-2bb4mlba6k8XfV8L_bk5LVLaYkZ45-R2raRuCM', '2025-07-27 12:05:20'),
(8, 'Allan Jones', 'allan@gmail.com', '$2b$10$mli7G034n2/pDoMwzAw4Uu46DfWqo8QM.PtEXjPW4Qf8WBa3m31fS', 'WIN_20250331_15_01_18_Pro-1753529624038-58519595.jpg', 'user', 'active', '2025-07-26 11:33:44', 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzUzNTQxNjUyfQ.XEbJrFyzSDHroeL4RHQrf34CkqSGheMgnLHs4a-kFao', '2025-07-27 14:54:12'),
(9, 'Thea Trice', 'thea@gmail.com', '$2b$10$Wt96T/F4PZkQh6/r7dL3HePcmqWGTzVmaO1rtCPM/UaBF5CGshd7a', 'jupiter-1754218499477-350913466.jpg', 'user', 'active', '2025-08-03 10:54:59', 0, '1e80a1051a4eff4c860f6765fc5f63a451f13a26493263199acebf589ba0601f', NULL, NULL),
(11, 'Bea Jice', 'bea@gmail.com', '$2b$10$5.gxydjxSXp8riUkDDU10OI3GIwRjUKCjmN6ziAMqR7Tn1IufPao6', 'WIN_20250310_13_27_32_Pro-1754219193859-628165642.jpg', 'user', 'active', '2025-08-03 11:06:34', 0, '2ac279a435e9fe41a98b7841e2cc23f68da30274eff354b3a38fdb05cad9bc4b', NULL, NULL),
(13, 'Carl Elumba', 'carl@gmail.com', '$2b$10$CkepjnH3eo2YplWcde5q..tQc8PJ5x1FdhEtkzRDD6m0d531wp49i', 'WIN_20250222_15_55_23_Pro-1754219856759-490539420.jpg', 'user', 'active', '2025-08-03 11:17:36', 1, NULL, NULL, NULL),
(14, 'Janna', 'janna@gmail.com', '$2b$10$qyhstg7fMwjl7o1dLaQY3u/oFQjLAISPPzBntvhJIWdGycjv5twCK', 'WIN_20250222_15_55_23_Pro-1754220267044-149953804.jpg', 'user', 'active', '2025-08-03 11:24:27', 0, '61c5e92e984911d3b59d0ad2b08756fc43eb3eb05b5fd779e50e03d1cbdd36dc', NULL, NULL),
(15, 'Lalan', 'lalan@gmail.com', '$2b$10$0vbcBnV8IDLaPCqSRitmW.DCkUv7JLwfEnnJHheCL.Upr8azbO/dy', 'WIN_20250222_15_55_23_Pro-1754223807292-495691946.jpg', 'user', 'active', '2025-08-03 12:23:27', 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTc1NDIyOTk0MH0.xBwx3Fs84wm0aaNSEAQk9-Sxz5OI1E3U75dxrK1hjJM', '2025-08-04 14:05:40'),
(16, 'Michael Danque', 'danque@gmail.com', '$2b$10$iBKdMpc0peLSCwlIjeR7guK2LRjsiDPS0v1BHBnlXAo3H4PJsBvDu', 'WIN_20250310_13_27_32_Pro-1754357085748-542045591.jpg', 'user', 'active', '2025-08-05 01:24:45', 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTYsImlhdCI6MTc1NDM1NzExMn0.81QQDUHhLpnqHX1Ujxq1Y25w47iPhYCwJbIxXEpkQbY', '2025-08-06 01:25:12');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `item`
--
ALTER TABLE `item`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `orderinfo`
--
ALTER TABLE `orderinfo`
  ADD PRIMARY KEY (`orderinfo_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `orderline`
--
ALTER TABLE `orderline`
  ADD PRIMARY KEY (`orderline_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_review` (`user_id`,`item_id`,`order_id`),
  ADD KEY `idx_reviews_item_id` (`item_id`),
  ADD KEY `idx_reviews_user_id` (`user_id`),
  ADD KEY `idx_reviews_order_id` (`order_id`),
  ADD KEY `idx_reviews_rating` (`rating`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_auth_token` (`auth_token`),
  ADD KEY `idx_users_token_expires` (`token_expires_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `item`
--
ALTER TABLE `item`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `orderinfo`
--
ALTER TABLE `orderinfo`
  MODIFY `orderinfo_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `orderline`
--
ALTER TABLE `orderline`
  MODIFY `orderline_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orderinfo`
--
ALTER TABLE `orderinfo`
  ADD CONSTRAINT `orderinfo_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orderinfo` (`orderinfo_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
