import request from "supertest";
import app from "../../app";

it("returns 200 on successful signout", async () => {
  await request(app)
    .post("/api/users/signup")
    .send({
      email: "test@test.com",
      password: "password",
    })
    .expect(201);

  const response = await request(app).get("/api/users/signout").expect(200);

  expect(response.get("Set-Cookie")).toBeDefined();
  expect(response.get("Set-Cookie")).toEqual([
    "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly",
  ]);
});
