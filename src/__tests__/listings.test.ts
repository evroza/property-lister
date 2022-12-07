import { server } from "../server";
import supertest from "supertest";

const app = server.app;

describe("Listings", () => {
    describe("/listings route", () => {
        describe("given listings exist", () => {
            it("should pass", async () => {
                await supertest(app).get(`/listings}`).expect(404);
            })
        });
    });
});