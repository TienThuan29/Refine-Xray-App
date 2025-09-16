import { Request, Response } from "express";
import { TestService } from "@/services/test.service";
import { TestItem } from "@/models/item.test.model";
import { ResponseUtil } from "@/libs/response";

const testService = new TestService();

/**
 * @swagger
 * components:
 *   schemas:
 *     TestItem:
 *       type: object
 *       required: [name, description]
 *       properties:
 *         name: 
 *           type: string
 *           description: Name of the test item
 *         description: 
 *           type: string
 *           description: Description of the test item
 *         value:
 *           type: number
 *           description: Numeric value for the test item
 *     TestItemResponse:
 *       type: object
 *       properties:
 *         success: 
 *           type: boolean
 *         message: 
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             id: 
 *               type: string
 *             name: 
 *               type: string
 *             description: 
 *               type: string
 *             value: 
 *               type: number
 *             createdAt: 
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /test/create-test-item:
 *   post:
 *     summary: Create a new test item
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestItem'
 *     responses:
 *       200:
 *         description: Test item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestItemResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: 
 *                   type: boolean
 *                 message: 
 *                   type: string
 */
export async function testCreateItem(request: Request, response: Response) {
    const testItem: TestItem = request.body;
    const result = await testService.createTestItem(testItem);
    ResponseUtil.success(response, result, "Test item created successfully");
}