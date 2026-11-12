import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity('user_mappings')
@Unique('uq_user_mappings_id1_id2', ['id1', 'id2'])
export class UserMapping {
  @PrimaryColumn({ type: 'char', length: 36 })
  userID!: string;

  @Column({
    type: 'varchar',
    length: 255,
    collation: 'utf8mb4_0900_bin',
  })
  id1!: string;

  @Column({
    type: 'varchar',
    length: 255,
    collation: 'utf8mb4_0900_bin',
  })
  id2!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
