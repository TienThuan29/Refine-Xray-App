import { Request, Response } from "express";
import { TestService } from "@/services/test.service";
import { TestItem } from "@/models/item.test.model";
import { ResponseUtil } from "@/libs/response";

const testService = new TestService();

export async function testCreateItem(request: Request, response: Response) {
    const testItem: TestItem = request.body;
    const result = await testService.createTestItem(testItem);
    ResponseUtil.success(response, result, "Test item created successfully");
}