import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ParsedRequestParams } from '@nestjsx/crud-request';
import { objKeys } from '@nestjsx/util';

import {
  CreateManyDto,
  CrudRequest,
  CrudRequestOptions,
  GetManyDefaultResponse,
  QueryOptions,
} from '../interfaces';

export abstract class CrudService<T> {
  abstract getMany(req: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]>;

  abstract getOne(req: CrudRequest): Promise<T>;

  abstract createOne(req: CrudRequest, dto: T): Promise<T>;

  abstract createMany(req: CrudRequest, dto: CreateManyDto): Promise<T[]>;

  abstract updateOne(req: CrudRequest, dto: T): Promise<T>;

  abstract replaceOne(req: CrudRequest, dto: T): Promise<T>;

  abstract deleteOne(req: CrudRequest): Promise<void | T>;

  throwBadRequestException(msg?: any): BadRequestException {
    throw new BadRequestException(msg);
  }

  throwNotFoundException(name: string): NotFoundException {
    throw new NotFoundException(`${name} not found`);
  }

  /**
   * Wrap page into page-info
   * override this method to create custom page-info response
   * or set custom `serialize.getMany` dto in the controller's CrudOption
   * @param data
   * @param total
   * @param limit
   * @param offset
   */
  createPageInfo(
    data: T[],
    total: number,
    limit: number,
    offset: number,
  ): GetManyDefaultResponse<T> {
    return {
      data,
      count: data.length,
      total,
      page: Math.floor(offset / limit) + 1,
      pageCount:
        limit && total
          ? Math.ceil(total / limit)
          : /* istanbul ignore next line */
            undefined,
    };
  }

  /**
   * Determine if need paging
   * @param parsed
   * @param options
   */
  decidePagination(parsed: ParsedRequestParams, options: CrudRequestOptions): boolean {
    return (
      options.query.alwaysPaginate ||
      ((Number.isFinite(parsed.page) || Number.isFinite(parsed.offset)) &&
        /* istanbul ignore next */ !!this.getTake(parsed, options.query))
    );
  }

  /**
   * Get number of resources to be fetched
   * @param query
   * @param options
   */
  getTake(query: ParsedRequestParams, options: QueryOptions): number | null {
    if (query.limit) {
      return options.maxLimit
        ? query.limit <= options.maxLimit
          ? query.limit
          : options.maxLimit
        : query.limit;
    }
    /* istanbul ignore if */
    if (options.limit) {
      return options.maxLimit
        ? options.limit <= options.maxLimit
          ? options.limit
          : options.maxLimit
        : options.limit;
    }

    return options.maxLimit ? options.maxLimit : null;
  }

  /**
   * Get number of resources to be skipped
   * @param query
   * @param take
   */
  getSkip(query: ParsedRequestParams, take: number): number | null {
    return query.page && take
      ? take * (query.page - 1)
      : query.offset
      ? query.offset
      : null;
  }

  /**
   * Get primary param name from CrudOptions
   * @param options
   */
  getPrimaryParam(options: CrudRequestOptions): string {
    const param = objKeys(options.params).find(
      (n) => options.params[n] && options.params[n].primary,
    );

    /* istanbul ignore if */
    if (!param) {
      return undefined;
    }

    return options.params[param].field;
  }
}
