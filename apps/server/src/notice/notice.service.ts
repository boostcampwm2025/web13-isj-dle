import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { DeleteResult, Repository } from "typeorm";

import { NoticeEntity } from "./notice.entity";

@Injectable()
export class NoticeService {
  constructor(@InjectRepository(NoticeEntity) private noticeRepository: Repository<NoticeEntity>) {}

  findAll(): Promise<NoticeEntity[]> {
    return this.noticeRepository.find();
  }

  findByRoomId(roomId: string): Promise<NoticeEntity[]> {
    return this.noticeRepository.find({ where: { roomId } });
  }

  createNotice(title: string, content: string, roomId: string): Promise<NoticeEntity> {
    const notice = this.noticeRepository.create({ title, content, roomId });
    return this.noticeRepository.save(notice);
  }

  deleteNotice(id: number): Promise<DeleteResult> {
    return this.noticeRepository.delete(id);
  }
}
