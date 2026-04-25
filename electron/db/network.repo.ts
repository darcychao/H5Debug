import { getDatabase, saveDatabase } from './database';

export interface NetworkRecordRow {
  id: string;
  request_id: string;
  url: string;
  method: string;
  headers: string;
  post_data: string | null;
  resource_type: string;
  status: number;
  status_text: string;
  response_headers: string;
  response_body: string | null;
  timestamp: number;
}

export function insertNetworkRecord(record: NetworkRecordRow): void {
  const db = getDatabase();
  db.run(
    `INSERT INTO network_record (id, request_id, url, method, headers, post_data, resource_type, status, status_text, response_headers, response_body, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [record.id, record.request_id, record.url, record.method, record.headers, record.post_data,
     record.resource_type, record.status, record.status_text, record.response_headers, record.response_body, record.timestamp],
  );
  saveDatabase();
}

export function getNetworkRecords(limit = 500): NetworkRecordRow[] {
  const db = getDatabase();
  const results = db.exec('SELECT * FROM network_record ORDER BY timestamp DESC LIMIT ?', [limit]);
  if (results.length === 0) return [];
  return results[0].values.map((row) => ({
    id: row[0] as string,
    request_id: row[1] as string,
    url: row[2] as string,
    method: row[3] as string,
    headers: row[4] as string,
    post_data: row[5] as string | null,
    resource_type: row[6] as string,
    status: row[7] as number,
    status_text: row[8] as string,
    response_headers: row[9] as string,
    response_body: row[10] as string | null,
    timestamp: row[11] as number,
  }));
}

export function clearNetworkRecords(): void {
  const db = getDatabase();
  db.run('DELETE FROM network_record');
  saveDatabase();
}
