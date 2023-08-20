USE recordcollection_online;

-- get current size of collection for user "demo"
SELECT COUNT(*) FROM collections r
INNER JOIN users u ON (u.id=r.userID)
WHERE (u.username='demo');

-- clear collection
DELETE r.* FROM collections r
INNER JOIN users u ON (u.id=r.userID)
WHERE (u.username='demo');

-- populate with a few albums
INSERT INTO collections (userID, releaseID, dateAdded)
SELECT users.id, releases.releaseID, NOW()
FROM users
CROSS JOIN (
    SELECT 24047 AS releaseID UNION ALL     --  Abbey Road
    SELECT 81550 AS releaseID UNION ALL     --  Go-Go's
    SELECT 32287 AS releaseID UNION ALL     --  Coltrane
    SELECT  5948 AS releaseID UNION ALL     --  MBV
    SELECT 96559 AS releaseID               --  Rickroll
) AS releases
WHERE users.username = 'demo';

