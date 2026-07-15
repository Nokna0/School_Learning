-- 화학(chemistry) 과목을 탐구(science)로 변경하고 국어(korean)를 추가한다.
-- 기존 'chemistry' 데이터가 있으면 enum 을 좁히기 전에 'science' 로 옮겨야 하므로,
-- (1) enum 을 임시로 넓히고 → (2) 데이터를 remap 한 뒤 → (3) 최종 enum 으로 좁힌다.

-- materials
ALTER TABLE `materials` MODIFY COLUMN `subject` enum('math','english','chemistry','science','korean') NOT NULL;--> statement-breakpoint
UPDATE `materials` SET `subject` = 'science' WHERE `subject` = 'chemistry';--> statement-breakpoint
ALTER TABLE `materials` MODIFY COLUMN `subject` enum('math','english','science','korean') NOT NULL;--> statement-breakpoint

-- quiz_sessions
ALTER TABLE `quiz_sessions` MODIFY COLUMN `subject` enum('math','english','chemistry','science','korean') NOT NULL;--> statement-breakpoint
UPDATE `quiz_sessions` SET `subject` = 'science' WHERE `subject` = 'chemistry';--> statement-breakpoint
ALTER TABLE `quiz_sessions` MODIFY COLUMN `subject` enum('math','english','science','korean') NOT NULL;--> statement-breakpoint

-- study_records
ALTER TABLE `study_records` MODIFY COLUMN `subject` enum('math','english','chemistry','science','korean') NOT NULL;--> statement-breakpoint
UPDATE `study_records` SET `subject` = 'science' WHERE `subject` = 'chemistry';--> statement-breakpoint
ALTER TABLE `study_records` MODIFY COLUMN `subject` enum('math','english','science','korean') NOT NULL;--> statement-breakpoint

-- 사용하지 않는 과목별 시간 컬럼 제거(집계는 study_records 에서 수행)
ALTER TABLE `study_statistics` DROP COLUMN `math_minutes`;--> statement-breakpoint
ALTER TABLE `study_statistics` DROP COLUMN `english_minutes`;--> statement-breakpoint
ALTER TABLE `study_statistics` DROP COLUMN `chemistry_minutes`;
